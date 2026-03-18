import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { success, paginated, error } from '../utils/response';

export async function listDeals(req: Request, res: Response) {
  try {
    const { search, status, market, fund, starred, page = '1', limit = '50', sortBy = 'date_modified', sortOrder = 'desc' } = req.query;

    let query = supabase
      .from('deals')
      .select('*, property:properties(*), rent_rolls(id, report_date, uploaded_at, total_units, occupied_units, occupancy_pct, has_anomalies), operating_statements(id, period_start, period_end, period_type, budget_type, uploaded_at)', { count: 'exact' });

    if (search) {
      query = query.or(`deal_name.ilike.%${search}%,deal_id.ilike.%${search}%`);
    }
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      query = query.in('status', statuses as string[]);
    }
    if (fund) query = query.eq('fund', fund);
    if (starred === 'true') query = query.eq('is_starred', true);

    const p = parseInt(page as string);
    const l = parseInt(limit as string);
    const from = (p - 1) * l;
    const to = from + l - 1;

    query = query.order(sortBy as string, { ascending: sortOrder === 'asc' }).range(from, to);

    const { data, error: dbErr, count } = await query;
    if (dbErr) return error(res, dbErr.message);

    const total = count || 0;
    return paginated(res, data || [], { total, page: p, limit: l, totalPages: Math.ceil(total / l) });
  } catch (err: any) {
    return error(res, err.message);
  }
}

export async function getDeal(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error: dbErr } = await supabase
      .from('deals')
      .select('*, property:properties(*), rent_rolls(id, report_date, uploaded_at, total_units, occupied_units, occupancy_pct, has_anomalies), operating_statements(id, period_start, period_end, period_type, budget_type, uploaded_at)')
      .eq('id', id)
      .single();

    if (dbErr) return error(res, dbErr.message, 404);
    return success(res, data);
  } catch (err: any) {
    return error(res, err.message);
  }
}

export async function createDeal(req: Request, res: Response) {
  try {
    const { deal_id, deal_name, status, asset_type, organization_id, deal_type, fund, bid_due_date, due_diligence_date, broker, broker_email, broker_phone, comments, address, city, state, zip, market } = req.body;

    if (!deal_id || !deal_name || !status || !asset_type || !organization_id) {
      return error(res, 'deal_id, deal_name, status, asset_type, and organization_id are required', 400);
    }

    const { data: deal, error: dealErr } = await supabase
      .from('deals')
      .insert({ deal_id, deal_name, status, asset_type, organization_id, deal_type, fund, bid_due_date, due_diligence_date, broker, broker_email, broker_phone, comments })
      .select()
      .single();

    if (dealErr) return error(res, dealErr.message);

    // Create property record if location provided
    if (address || city || state || zip || market) {
      await supabase.from('properties').insert({
        deal_pk: deal.id,
        address, city, state, zip, market,
      });
    }

    // Re-fetch with joins
    const { data: fullDeal } = await supabase
      .from('deals')
      .select('*, property:properties(*)')
      .eq('id', deal.id)
      .single();

    return success(res, fullDeal, 'Deal created', 201);
  } catch (err: any) {
    return error(res, err.message);
  }
}

export async function updateDeal(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body;

    // Separate deal fields from property fields
    const dealFields: Record<string, any> = {};
    const propFields: Record<string, any> = {};
    const dealCols = ['deal_name', 'status', 'asset_type', 'deal_type', 'fund', 'bid_due_date', 'due_diligence_date', 'broker', 'broker_email', 'broker_phone', 'comments', 'is_starred', 'flags_r', 'flags_h', 'flags_m'];
    const propCols = ['address', 'city', 'state', 'zip', 'market', 'parcel', 'building_type', 'year_built', 'year_renovated', 'buildings', 'stories', 'residential_sqft', 'total_units', 'acres', 'parking_spaces', 'asset_quality', 'location_quality', 'age_restricted', 'affordable_units_pct', 'affordability_status', 'multifamily_housing_type', 'property_manager', 'university_affiliation', 'amenities'];

    for (const [k, v] of Object.entries(body)) {
      if (dealCols.includes(k)) dealFields[k] = v;
      else if (propCols.includes(k)) propFields[k] = v;
    }

    // Update deal
    if (Object.keys(dealFields).length > 0) {
      const { error: dealErr } = await supabase.from('deals').update(dealFields).eq('id', id);
      if (dealErr) return error(res, dealErr.message);
    }

    // Upsert property
    if (Object.keys(propFields).length > 0) {
      const { data: existing } = await supabase.from('properties').select('id').eq('deal_pk', id).single();
      if (existing) {
        await supabase.from('properties').update(propFields).eq('deal_pk', id);
      } else {
        await supabase.from('properties').insert({ deal_pk: id, ...propFields });
      }
    }

    // Re-fetch
    const { data: fullDeal } = await supabase
      .from('deals')
      .select('*, property:properties(*)')
      .eq('id', id)
      .single();

    return success(res, fullDeal, 'Deal updated');
  } catch (err: any) {
    return error(res, err.message);
  }
}

export async function deleteDeal(req: Request, res: Response) {
  try {
    const { id } = req.params;
    // Delete related data first
    await supabase.from('properties').delete().eq('deal_pk', id);
    // Delete rent roll units then rent rolls
    const { data: rrs } = await supabase.from('rent_rolls').select('id').eq('deal_pk', id);
    if (rrs) {
      for (const rr of rrs) {
        await supabase.from('rent_roll_units').delete().eq('rent_roll_id', rr.id);
      }
    }
    await supabase.from('rent_rolls').delete().eq('deal_pk', id);
    // Delete OS line items then OS
    const { data: oss } = await supabase.from('operating_statements').select('id').eq('deal_pk', id);
    if (oss) {
      for (const os of oss) {
        await supabase.from('operating_statement_line_items').delete().eq('os_id', os.id);
      }
    }
    await supabase.from('operating_statements').delete().eq('deal_pk', id);
    // Delete deal
    const { error: delErr } = await supabase.from('deals').delete().eq('id', id);
    if (delErr) return error(res, delErr.message);

    return success(res, { id, deleted: true });
  } catch (err: any) {
    return error(res, err.message);
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;
    if (!newStatus) return error(res, 'status required', 400);

    const { data, error: dbErr } = await supabase
      .from('deals')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (dbErr) return error(res, dbErr.message);
    return success(res, data);
  } catch (err: any) {
    return error(res, err.message);
  }
}

export async function toggleStar(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data: deal, error: fetchErr } = await supabase.from('deals').select('is_starred').eq('id', id).single();
    if (fetchErr) return error(res, fetchErr.message, 404);

    const { data, error: updErr } = await supabase
      .from('deals')
      .update({ is_starred: !deal.is_starred })
      .eq('id', id)
      .select('id, is_starred')
      .single();

    if (updErr) return error(res, updErr.message);
    return success(res, data);
  } catch (err: any) {
    return error(res, err.message);
  }
}

export async function getStats(_req: Request, res: Response) {
  try {
    const { data: deals, error: dbErr } = await supabase.from('deals').select('status, fund');
    if (dbErr) return error(res, dbErr.message);

    const total = deals?.length || 0;
    const byStatus: Record<string, number> = {};
    const byFund: Record<string, number> = {};

    for (const d of deals || []) {
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
      const f = d.fund || 'Unassigned';
      byFund[f] = (byFund[f] || 0) + 1;
    }

    return success(res, {
      total,
      by_status: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      by_fund: Object.entries(byFund).map(([fund, count]) => ({ fund, count })),
    });
  } catch (err: any) {
    return error(res, err.message);
  }
}

export async function getStatusCategories(_req: Request, res: Response) {
  try {
    const { data: deals, error: dbErr } = await supabase.from('deals').select('status');
    if (dbErr) return error(res, dbErr.message);

    const counts: Record<string, number> = {};
    for (const d of deals || []) {
      counts[d.status] = (counts[d.status] || 0) + 1;
    }

    return success(res, Object.entries(counts).map(([status, count]) => ({ status, count })));
  } catch (err: any) {
    return error(res, err.message);
  }
}
