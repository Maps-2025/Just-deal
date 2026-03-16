import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { supabase } from '../config/supabase';
import { success, error } from '../utils/response';

// ─── List rent rolls ──────────────────────────────────────────────────────────
export async function listRentRolls(req: Request, res: Response) {
  try {
    const { dealId } = req.params;
    const { data, error: dbErr } = await supabase
      .from('rent_rolls')
      .select('*')
      .eq('deal_pk', dealId)
      .order('uploaded_at', { ascending: false });
    if (dbErr) return error(res, dbErr.message);
    return success(res, data);
  } catch (err: any) { return error(res, err.message); }
}

// ─── Latest rent roll ─────────────────────────────────────────────────────────
export async function latestRentRoll(req: Request, res: Response) {
  try {
    const { dealId } = req.params;
    const { data, error: dbErr } = await supabase
      .from('rent_rolls')
      .select('*')
      .eq('deal_pk', dealId)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();
    if (dbErr) return error(res, 'No rent roll found', 404);
    return success(res, data);
  } catch (err: any) { return error(res, err.message); }
}

// ─── Get single rent roll ─────────────────────────────────────────────────────
export async function getRentRoll(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    const { data, error: dbErr } = await supabase.from('rent_rolls').select('*').eq('id', rrId).single();
    if (dbErr) return error(res, dbErr.message, 404);
    return success(res, data);
  } catch (err: any) { return error(res, err.message); }
}

// ─── Upload rent roll ─────────────────────────────────────────────────────────
export async function uploadRentRoll(req: Request, res: Response) {
  try {
    const { dealId } = req.params;
    const file = req.file;
    const totalUnits = parseInt(req.body.totalUnits) || 0;
    const reportDate = req.body.reportDate || new Date().toISOString().split('T')[0];

    if (!file) return error(res, 'File is required', 400);

    // Parse Excel
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rawRows.length < 2) return error(res, 'File has no data rows', 400);

    const headers = rawRows[0].map((h: any) => String(h || '').trim());
    const dataRows = rawRows.slice(1).filter((r: any[]) => r.some(c => c != null && c !== ''));

    // Create rent roll record
    const { data: rentRoll, error: rrErr } = await supabase
      .from('rent_rolls')
      .insert({
        deal_pk: dealId,
        report_date: reportDate,
        total_units: totalUnits || dataRows.length,
        processing_status: 'uploaded',
        raw_data: { headers, rows: dataRows },
      })
      .select()
      .single();

    if (rrErr) return error(res, rrErr.message);

    return success(res, {
      rent_roll_id: rentRoll.id,
      headers,
      row_count: dataRows.length,
      preview: dataRows.slice(0, 5),
    }, 'File uploaded', 201);
  } catch (err: any) { return error(res, err.message); }
}

// ─── Delete rent roll ─────────────────────────────────────────────────────────
export async function deleteRentRoll(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    await supabase.from('rent_roll_units').delete().eq('rent_roll_id', rrId);
    await supabase.from('rent_rolls').delete().eq('id', rrId);
    return success(res, { id: rrId, deleted: true });
  } catch (err: any) { return error(res, err.message); }
}

// ─── Save column mapping ─────────────────────────────────────────────────────
export async function saveMapping(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    const { mapping } = req.body;

    const { data: rr, error: rrErr } = await supabase
      .from('rent_rolls')
      .select('raw_data')
      .eq('id', rrId)
      .single();

    if (rrErr || !rr?.raw_data) return error(res, 'Rent roll not found or no raw data', 404);

    const { headers, rows } = rr.raw_data as { headers: string[]; rows: any[][] };
    const headerIndex: Record<string, number> = {};
    headers.forEach((h: string, i: number) => { headerIndex[h] = i; });

    const fieldMap: Record<string, string> = {
      unit_no: 'unit_no', floor_plan: 'floor_plan', net_sqft: 'net_sqft',
      bedrooms: 'bedrooms', bathrooms: 'bathrooms', unit_type: 'unit_type',
      lease_type: 'lease_type', occupancy_status: 'occupancy_status',
      market_rent: 'market_rent', contractual_rent: 'contractual_rent',
      lease_start_date: 'lease_start_date', lease_end_date: 'lease_end_date',
      move_in_date: 'move_in_date', move_out_date: 'move_out_date',
      tenant_name: 'tenant_name', renovation_status: 'renovation_status',
      recurring_concessions: 'recurring_concessions', net_effective_rent: 'net_effective_rent',
      lease_term_months: 'lease_term_months',
    };

    const numericFields = ['net_sqft', 'bedrooms', 'bathrooms', 'market_rent', 'contractual_rent',
      'recurring_concessions', 'net_effective_rent', 'lease_term_months'];

    const units = rows.map((row: any[]) => {
      const unit: Record<string, any> = { rent_roll_id: rrId };
      for (const [fieldKey, dbCol] of Object.entries(fieldMap)) {
        const excelCol = mapping[fieldKey];
        if (excelCol && headerIndex[excelCol] !== undefined) {
          let val = row[headerIndex[excelCol]];
          if (numericFields.includes(dbCol)) {
            val = val != null ? parseFloat(String(val).replace(/[$,]/g, '')) : null;
            if (isNaN(val as number)) val = null;
          }
          unit[dbCol] = val ?? null;
        }
      }
      return unit;
    });

    // Delete existing units
    await supabase.from('rent_roll_units').delete().eq('rent_roll_id', rrId);

    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < units.length; i += batchSize) {
      const batch = units.slice(i, i + batchSize);
      const { error: insErr } = await supabase.from('rent_roll_units').insert(batch);
      if (insErr) return error(res, insErr.message);
    }

    // Update rent roll
    await supabase.from('rent_rolls').update({
      column_mapping: mapping,
      processing_status: 'mapped',
      total_units: units.length,
    }).eq('id', rrId);

    return success(res, { units_created: units.length });
  } catch (err: any) { return error(res, err.message); }
}

// ─── Get units (paginated) ───────────────────────────────────────────────────
export async function getUnits(req: Request, res: Response) {
  try {
    const { dealId } = req.params;
    const { page = '1', limit = '200', search, occupancy_status, floor_plan, sortBy = 'unit_no', sortOrder = 'asc' } = req.query;

    // Get latest rent roll
    const { data: rr } = await supabase
      .from('rent_rolls')
      .select('id, report_date, total_units, occupied_units, occupancy_pct, has_anomalies')
      .eq('deal_pk', dealId)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (!rr) return success(res, []);

    let query = supabase.from('rent_roll_units').select('*', { count: 'exact' }).eq('rent_roll_id', rr.id);

    if (search) query = query.or(`unit_no.ilike.%${search}%,tenant_name.ilike.%${search}%`);
    if (occupancy_status) query = query.eq('occupancy_status', occupancy_status);
    if (floor_plan) query = query.eq('floor_plan', floor_plan);

    const p = parseInt(page as string);
    const l = parseInt(limit as string);
    query = query.order(sortBy as string, { ascending: sortOrder === 'asc' }).range((p - 1) * l, p * l - 1);

    const { data, error: dbErr, count } = await query;
    if (dbErr) return error(res, dbErr.message);

    return res.json({
      success: true,
      data: data || [],
      rent_roll: rr,
      meta: { total: count || 0, page: p, limit: l, totalPages: Math.ceil((count || 0) / l) },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) { return error(res, err.message); }
}

// ─── Unit mix ─────────────────────────────────────────────────────────────────
export async function getUnitMix(req: Request, res: Response) {
  try {
    const { dealId } = req.params;
    const { data: rr } = await supabase.from('rent_rolls').select('id, report_date').eq('deal_pk', dealId).order('uploaded_at', { ascending: false }).limit(1).single();
    if (!rr) return success(res, { rent_roll_id: null, report_date: null, unit_mix: [] });

    const { data: units } = await supabase.from('rent_roll_units').select('*').eq('rent_roll_id', rr.id);

    const fpMap: Record<string, any> = {};
    for (const u of units || []) {
      const fp = u.floor_plan || 'Unknown';
      if (!fpMap[fp]) fpMap[fp] = { floor_plan: fp, bedrooms: u.bedrooms, count: 0, occupied: 0, total_sqft: 0, total_market: 0, total_contract: 0 };
      fpMap[fp].count++;
      if (u.occupancy_status?.toLowerCase() !== 'vacant') fpMap[fp].occupied++;
      fpMap[fp].total_sqft += u.net_sqft || 0;
      fpMap[fp].total_market += u.market_rent || 0;
      fpMap[fp].total_contract += u.contractual_rent || 0;
    }

    const unitMix = Object.values(fpMap).map((fp: any) => ({
      floor_plan: fp.floor_plan,
      bedrooms: fp.bedrooms,
      count: fp.count,
      occupied: fp.occupied,
      avg_sqft: fp.count > 0 ? Math.round(fp.total_sqft / fp.count) : 0,
      avg_market_rent: fp.count > 0 ? Math.round(fp.total_market / fp.count) : 0,
      avg_contract_rent: fp.occupied > 0 ? Math.round(fp.total_contract / fp.occupied) : 0,
      occupancy_pct: fp.count > 0 ? Math.round((fp.occupied / fp.count) * 1000) / 10 : 0,
    }));

    return success(res, { rent_roll_id: rr.id, report_date: rr.report_date, unit_mix: unitMix });
  } catch (err: any) { return error(res, err.message); }
}

// ─── Floorplans ──────────────────────────────────────────────────────────────
export async function getFloorplans(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    const { data: units } = await supabase.from('rent_roll_units').select('*').eq('rent_roll_id', rrId);

    const fpMap: Record<string, any> = {};
    for (const u of units || []) {
      const fp = u.floor_plan || 'Unknown';
      if (!fpMap[fp]) fpMap[fp] = { floor_plan_code: fp, unit_type: u.unit_type || 'Residential', bedrooms: u.bedrooms, bathrooms: u.bathrooms, units: 0, net_sqft: 0, market_rent: 0, floor_plan_name: fp };
      fpMap[fp].units++;
      fpMap[fp].net_sqft += u.net_sqft || 0;
      fpMap[fp].market_rent += u.market_rent || 0;
    }

    const floorplans = Object.values(fpMap).map((fp: any) => ({
      ...fp,
      net_sqft: fp.units > 0 ? Math.round(fp.net_sqft / fp.units) : 0,
      market_rent: fp.units > 0 ? Math.round(fp.market_rent / fp.units) : 0,
    }));

    return success(res, floorplans);
  } catch (err: any) { return error(res, err.message); }
}

export async function updateFloorplans(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    const { floorplans } = req.body;
    for (const fp of floorplans) {
      await supabase.from('rent_roll_units').update({
        unit_type: fp.unit_type,
        bedrooms: fp.bedrooms,
        bathrooms: fp.bathrooms,
      }).eq('rent_roll_id', rrId).eq('floor_plan', fp.floor_plan_code);
    }
    await supabase.from('rent_rolls').update({ processing_status: 'floorplans_done' }).eq('id', rrId);
    return success(res, { updated: true });
  } catch (err: any) { return error(res, err.message); }
}

// ─── Occupancy ───────────────────────────────────────────────────────────────
export async function getOccupancy(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    const { data: units } = await supabase.from('rent_roll_units').select('occupancy_status, contractual_rent').eq('rent_roll_id', rrId);

    const occMap: Record<string, any> = {};
    for (const u of units || []) {
      const code = u.occupancy_status || 'Unknown';
      if (!occMap[code]) occMap[code] = { occupancy_code: code, total_units: 0, total_charges: 0, occupancy_status: 'Occupied' };
      occMap[code].total_units++;
      occMap[code].total_charges += u.contractual_rent || 0;
    }
    for (const occ of Object.values(occMap) as any[]) {
      const lower = occ.occupancy_code.toLowerCase();
      if (lower.includes('vacant') || lower.includes('empty')) occ.occupancy_status = 'Vacant';
    }

    return success(res, Object.values(occMap));
  } catch (err: any) { return error(res, err.message); }
}

export async function updateOccupancy(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    const { occupancy } = req.body;
    for (const occ of occupancy) {
      await supabase.from('rent_roll_units').update({ occupancy_status: occ.occupancy_status })
        .eq('rent_roll_id', rrId).eq('occupancy_status', occ.occupancy_code);
    }
    await supabase.from('rent_rolls').update({ processing_status: 'occupancy_done' }).eq('id', rrId);
    return success(res, { updated: true });
  } catch (err: any) { return error(res, err.message); }
}

// ─── Charges ─────────────────────────────────────────────────────────────────
export async function getCharges(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    const { data: units } = await supabase.from('rent_roll_units').select('contractual_rent').eq('rent_roll_id', rrId);
    let totalAmount = 0;
    for (const u of units || []) totalAmount += u.contractual_rent || 0;
    return success(res, [{ charge_code: 'rent', total_amount: totalAmount, charge_category: 'Contractual Rent' }]);
  } catch (err: any) { return error(res, err.message); }
}

export async function updateCharges(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    await supabase.from('rent_rolls').update({ processing_status: 'charges_done' }).eq('id', rrId);
    return success(res, { updated: true });
  } catch (err: any) { return error(res, err.message); }
}

// ─── Renovations ─────────────────────────────────────────────────────────────
export async function updateRenovations(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    const { renovations } = req.body;
    for (const r of renovations) {
      await supabase.from('rent_roll_units').update({ renovation_status: r.renovation_description })
        .eq('rent_roll_id', rrId).eq('floor_plan', r.floor_plan_code);
    }
    await supabase.from('rent_rolls').update({ processing_status: 'renovations_done' }).eq('id', rrId);
    return success(res, { updated: true });
  } catch (err: any) { return error(res, err.message); }
}

// ─── Affordability ───────────────────────────────────────────────────────────
export async function updateAffordability(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    const { has_affordable, lease_types } = req.body;
    if (has_affordable && lease_types) {
      for (const lt of lease_types) {
        await supabase.from('rent_roll_units').update({ lease_type: lt.lease_type })
          .eq('rent_roll_id', rrId).eq('floor_plan', lt.floor_plan_code);
      }
    }
    await supabase.from('rent_rolls').update({ processing_status: 'affordability_done' }).eq('id', rrId);
    return success(res, { updated: true });
  } catch (err: any) { return error(res, err.message); }
}

// ─── Finalize ────────────────────────────────────────────────────────────────
export async function finalizeRentRoll(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    const { data: units } = await supabase.from('rent_roll_units').select('occupancy_status, contractual_rent, market_rent').eq('rent_roll_id', rrId);

    const total = units?.length || 0;
    const occupied = units?.filter((u: any) => {
      const s = u.occupancy_status?.toLowerCase();
      return s === 'occupied' || s === 'current' || s === 'notice-unrented';
    }).length || 0;
    const occupancyPct = total > 0 ? Math.round((occupied / total) * 1000) / 10 : 0;

    let hasAnomalies = false;
    for (const u of units || []) {
      if (u.contractual_rent && u.market_rent) {
        const variance = Math.abs(u.contractual_rent - u.market_rent) / u.market_rent;
        if (variance > 0.5) { hasAnomalies = true; break; }
      }
    }

    await supabase.from('rent_rolls').update({
      processing_status: 'finalized',
      total_units: total,
      occupied_units: occupied,
      occupancy_pct: occupancyPct,
      has_anomalies: hasAnomalies,
      raw_data: null,
    }).eq('id', rrId);

    return success(res, { total_units: total, occupied_units: occupied, occupancy_pct: occupancyPct, has_anomalies: hasAnomalies });
  } catch (err: any) { return error(res, err.message); }
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export async function getDashboard(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    const { data: units } = await supabase.from('rent_roll_units').select('*').eq('rent_roll_id', rrId);

    const unitTypes: Record<string, number> = {};
    const leaseTypes: Record<string, number> = {};
    const renovationStatus: Record<string, number> = {};

    for (const u of units || []) {
      const ut = u.unit_type || 'Unknown';
      unitTypes[ut] = (unitTypes[ut] || 0) + 1;
      const lt = u.lease_type || 'Market';
      leaseTypes[lt] = (leaseTypes[lt] || 0) + 1;
      const rs = u.renovation_status || 'Unrenovated';
      renovationStatus[rs] = (renovationStatus[rs] || 0) + 1;
    }

    return success(res, {
      unit_types: Object.entries(unitTypes).map(([name, value]) => ({ name, value })),
      lease_types: Object.entries(leaseTypes).map(([name, value]) => ({ name, value })),
      renovation_status: Object.entries(renovationStatus).map(([name, value]) => ({ name, value })),
      total_units: units?.length || 0,
      occupied: units?.filter((u: any) => u.occupancy_status?.toLowerCase() !== 'vacant').length || 0,
    });
  } catch (err: any) { return error(res, err.message); }
}

// ─── Floor plan summary ──────────────────────────────────────────────────────
export async function getFloorPlanSummary(req: Request, res: Response) {
  try {
    const { rrId } = req.params;
    const { data: units } = await supabase.from('rent_roll_units').select('*').eq('rent_roll_id', rrId);

    const fpMap: Record<string, any> = {};
    for (const u of units || []) {
      const fp = u.floor_plan || 'Unknown';
      if (!fpMap[fp]) fpMap[fp] = { floor_plan: fp, bedrooms: u.bedrooms, bathrooms: u.bathrooms, units: 0, occupied: 0, vacant: 0, total_sqft: 0, total_market: 0, total_contract: 0 };
      fpMap[fp].units++;
      if (u.occupancy_status?.toLowerCase() !== 'vacant') fpMap[fp].occupied++;
      else fpMap[fp].vacant++;
      fpMap[fp].total_sqft += u.net_sqft || 0;
      fpMap[fp].total_market += u.market_rent || 0;
      fpMap[fp].total_contract += u.contractual_rent || 0;
    }

    const summary = Object.values(fpMap).map((fp: any) => ({
      floor_plan: fp.floor_plan,
      bedrooms: fp.bedrooms,
      bathrooms: fp.bathrooms,
      units: fp.units,
      occupied: fp.occupied,
      vacant: fp.vacant,
      occupancy_pct: fp.units > 0 ? Math.round((fp.occupied / fp.units) * 1000) / 10 : 0,
      avg_sqft: fp.units > 0 ? Math.round(fp.total_sqft / fp.units) : 0,
      avg_market_rent: fp.units > 0 ? Math.round(fp.total_market / fp.units) : 0,
      avg_contract_rent: fp.occupied > 0 ? Math.round(fp.total_contract / fp.occupied) : 0,
    }));

    return success(res, summary);
  } catch (err: any) { return error(res, err.message); }
}
