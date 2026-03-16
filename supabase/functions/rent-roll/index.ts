import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getSupabase(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, serviceKey);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.replace("/rent-roll", "").split("/").filter(Boolean);
    const method = req.method;
    const db = getSupabase(req);

    // POST / → upload
    if (method === "POST" && pathParts.length === 0) {
      return await handleUpload(req, db);
    }

    // GET /?dealId=xxx → list rent rolls for deal
    if (method === "GET" && pathParts.length === 0) {
      const dealId = url.searchParams.get("dealId");
      if (!dealId) return json({ error: "dealId required" }, 400);
      const { data, error } = await db
        .from("rent_rolls")
        .select("*")
        .eq("deal_pk", dealId)
        .order("uploaded_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data });
    }

    const rentRollId = pathParts[0];
    const action = pathParts[1];

    // DELETE /:id
    if (method === "DELETE" && !action) {
      await db.from("rent_roll_units").delete().eq("rent_roll_id", rentRollId);
      await db.from("rent_rolls").delete().eq("id", rentRollId);
      return json({ success: true, data: { id: rentRollId, deleted: true } });
    }

    // GET /:id
    if (method === "GET" && !action) {
      const { data, error } = await db.from("rent_rolls").select("*").eq("id", rentRollId).single();
      if (error) return json({ error: error.message }, 404);
      return json({ success: true, data });
    }

    // POST /:id/mapping
    if (method === "POST" && action === "mapping") {
      return await handleMapping(req, db, rentRollId);
    }

    // GET /:id/floorplans
    if (method === "GET" && action === "floorplans") {
      return await getFloorplans(db, rentRollId);
    }

    // PUT /:id/floorplans
    if (method === "PUT" && action === "floorplans") {
      return await updateFloorplans(req, db, rentRollId);
    }

    // GET /:id/occupancy
    if (method === "GET" && action === "occupancy") {
      return await getOccupancy(db, rentRollId);
    }

    // PUT /:id/occupancy
    if (method === "PUT" && action === "occupancy") {
      return await updateOccupancy(req, db, rentRollId);
    }

    // GET /:id/charges
    if (method === "GET" && action === "charges") {
      return await getCharges(db, rentRollId);
    }

    // PUT /:id/charges
    if (method === "PUT" && action === "charges") {
      return await updateCharges(req, db, rentRollId);
    }

    // PUT /:id/renovations
    if (method === "PUT" && action === "renovations") {
      return await updateRenovations(req, db, rentRollId);
    }

    // PUT /:id/affordability
    if (method === "PUT" && action === "affordability") {
      return await updateAffordability(req, db, rentRollId);
    }

    // POST /:id/finalize
    if (method === "POST" && action === "finalize") {
      return await finalizeRentRoll(db, rentRollId);
    }

    // GET /:id/dashboard
    if (method === "GET" && action === "dashboard") {
      return await getDashboard(db, rentRollId);
    }

    // GET /:id/units
    if (method === "GET" && action === "units") {
      const { data, error } = await db
        .from("rent_roll_units")
        .select("*")
        .eq("rent_roll_id", rentRollId)
        .order("unit_no", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data });
    }

    // GET /:id/floor-plan-summary
    if (method === "GET" && action === "floor-plan-summary") {
      return await getFloorPlanSummary(db, rentRollId);
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: err.message || "Internal error" }, 500);
  }
});

// ─── Upload handler ──────────────────────────────────────────────────────────
async function handleUpload(req: Request, db: any) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const dealId = formData.get("dealId") as string;
  const totalUnits = parseInt(formData.get("totalUnits") as string) || 0;
  const reportDate = (formData.get("reportDate") as string) || new Date().toISOString().split("T")[0];

  if (!file || !dealId) return json({ error: "file and dealId required" }, 400);

  // Parse Excel
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (rawRows.length < 2) return json({ error: "File has no data rows" }, 400);

  const headers = rawRows[0].map((h: any) => String(h || "").trim());
  const dataRows = rawRows.slice(1).filter((r: any[]) => r.some((c) => c != null && c !== ""));

  // Create rent roll record
  const { data: rentRoll, error: rrError } = await db
    .from("rent_rolls")
    .insert({
      deal_pk: dealId,
      report_date: reportDate,
      total_units: totalUnits || dataRows.length,
      processing_status: "uploaded",
      raw_data: { headers, rows: dataRows },
    })
    .select()
    .single();

  if (rrError) return json({ error: rrError.message }, 500);

  return json({
    success: true,
    data: {
      rent_roll_id: rentRoll.id,
      headers,
      row_count: dataRows.length,
      preview: dataRows.slice(0, 5),
    },
  });
}

// ─── Mapping handler ─────────────────────────────────────────────────────────
async function handleMapping(req: Request, db: any, rentRollId: string) {
  const { mapping } = await req.json();
  // mapping: { unit_no: "Unit Number", floor_plan: "Floor Plan Code", ... }

  const { data: rr, error: rrErr } = await db
    .from("rent_rolls")
    .select("raw_data")
    .eq("id", rentRollId)
    .single();

  if (rrErr || !rr?.raw_data) return json({ error: "Rent roll not found or no raw data" }, 404);

  const { headers, rows } = rr.raw_data;
  const headerIndex: Record<string, number> = {};
  headers.forEach((h: string, i: number) => { headerIndex[h] = i; });

  const fieldMap: Record<string, string> = {
    unit_no: "unit_no",
    floor_plan: "floor_plan",
    net_sqft: "net_sqft",
    bedrooms: "bedrooms",
    bathrooms: "bathrooms",
    unit_type: "unit_type",
    lease_type: "lease_type",
    occupancy_status: "occupancy_status",
    market_rent: "market_rent",
    contractual_rent: "contractual_rent",
    lease_start_date: "lease_start_date",
    lease_end_date: "lease_end_date",
    move_in_date: "move_in_date",
    move_out_date: "move_out_date",
    tenant_name: "tenant_name",
    renovation_status: "renovation_status",
    recurring_concessions: "recurring_concessions",
    net_effective_rent: "net_effective_rent",
    lease_term_months: "lease_term_months",
  };

  const units = rows.map((row: any[]) => {
    const unit: Record<string, any> = { rent_roll_id: rentRollId };
    for (const [fieldKey, dbCol] of Object.entries(fieldMap)) {
      const excelCol = mapping[fieldKey];
      if (excelCol && headerIndex[excelCol] !== undefined) {
        let val = row[headerIndex[excelCol]];
        // Parse numbers for numeric fields
        if (["net_sqft", "bedrooms", "bathrooms", "market_rent", "contractual_rent",
             "recurring_concessions", "net_effective_rent", "lease_term_months"].includes(dbCol)) {
          val = val != null ? parseFloat(String(val).replace(/[$,]/g, "")) : null;
          if (isNaN(val)) val = null;
        }
        unit[dbCol] = val ?? null;
      }
    }
    return unit;
  });

  // Delete existing units
  await db.from("rent_roll_units").delete().eq("rent_roll_id", rentRollId);

  // Insert mapped units in batches
  const batchSize = 100;
  for (let i = 0; i < units.length; i += batchSize) {
    const batch = units.slice(i, i + batchSize);
    const { error } = await db.from("rent_roll_units").insert(batch);
    if (error) return json({ error: error.message }, 500);
  }

  // Update rent roll
  await db.from("rent_rolls").update({
    column_mapping: mapping,
    processing_status: "mapped",
    total_units: units.length,
  }).eq("id", rentRollId);

  return json({ success: true, data: { units_created: units.length } });
}

// ─── Floorplans ──────────────────────────────────────────────────────────────
async function getFloorplans(db: any, rentRollId: string) {
  const { data: units, error } = await db
    .from("rent_roll_units")
    .select("*")
    .eq("rent_roll_id", rentRollId);
  if (error) return json({ error: error.message }, 500);

  const fpMap: Record<string, any> = {};
  for (const u of units) {
    const fp = u.floor_plan || "Unknown";
    if (!fpMap[fp]) {
      fpMap[fp] = {
        floor_plan_code: fp,
        unit_type: u.unit_type || "Residential",
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        units: 0,
        net_sqft: 0,
        market_rent: 0,
        floor_plan_name: fp,
      };
    }
    fpMap[fp].units++;
    fpMap[fp].net_sqft += u.net_sqft || 0;
    fpMap[fp].market_rent += u.market_rent || 0;
  }

  const floorplans = Object.values(fpMap).map((fp: any) => ({
    ...fp,
    net_sqft: fp.units > 0 ? Math.round(fp.net_sqft / fp.units) : 0,
    market_rent: fp.units > 0 ? Math.round(fp.market_rent / fp.units) : 0,
  }));

  return json({ success: true, data: floorplans });
}

async function updateFloorplans(req: Request, db: any, rentRollId: string) {
  const { floorplans } = await req.json();
  // Update units with floor plan details
  for (const fp of floorplans) {
    await db.from("rent_roll_units").update({
      unit_type: fp.unit_type,
      bedrooms: fp.bedrooms,
      bathrooms: fp.bathrooms,
    }).eq("rent_roll_id", rentRollId).eq("floor_plan", fp.floor_plan_code);
  }
  await db.from("rent_rolls").update({ processing_status: "floorplans_done" }).eq("id", rentRollId);
  return json({ success: true });
}

// ─── Occupancy ───────────────────────────────────────────────────────────────
async function getOccupancy(db: any, rentRollId: string) {
  const { data: units, error } = await db
    .from("rent_roll_units")
    .select("occupancy_status, contractual_rent")
    .eq("rent_roll_id", rentRollId);
  if (error) return json({ error: error.message }, 500);

  const occMap: Record<string, any> = {};
  for (const u of units) {
    const code = u.occupancy_status || "Unknown";
    if (!occMap[code]) {
      occMap[code] = { occupancy_code: code, total_units: 0, total_charges: 0, occupancy_status: "Occupied" };
    }
    occMap[code].total_units++;
    occMap[code].total_charges += u.contractual_rent || 0;
  }

  // Auto-detect vacant statuses
  for (const occ of Object.values(occMap) as any[]) {
    const lower = occ.occupancy_code.toLowerCase();
    if (lower.includes("vacant") || lower.includes("empty")) {
      occ.occupancy_status = "Vacant";
    }
  }

  return json({ success: true, data: Object.values(occMap) });
}

async function updateOccupancy(req: Request, db: any, rentRollId: string) {
  const { occupancy } = await req.json();
  for (const occ of occupancy) {
    const newStatus = occ.occupancy_status;
    await db.from("rent_roll_units").update({ occupancy_status: newStatus })
      .eq("rent_roll_id", rentRollId)
      .eq("occupancy_status", occ.occupancy_code);
  }
  await db.from("rent_rolls").update({ processing_status: "occupancy_done" }).eq("id", rentRollId);
  return json({ success: true });
}

// ─── Charges ─────────────────────────────────────────────────────────────────
async function getCharges(db: any, rentRollId: string) {
  const { data: units, error } = await db
    .from("rent_roll_units")
    .select("contractual_rent")
    .eq("rent_roll_id", rentRollId);
  if (error) return json({ error: error.message }, 500);

  let totalAmount = 0;
  for (const u of units) totalAmount += u.contractual_rent || 0;

  return json({
    success: true,
    data: [{ charge_code: "rent", total_amount: totalAmount, charge_category: "Contractual Rent" }],
  });
}

async function updateCharges(req: Request, db: any, rentRollId: string) {
  await db.from("rent_rolls").update({ processing_status: "charges_done" }).eq("id", rentRollId);
  return json({ success: true });
}

// ─── Renovations ─────────────────────────────────────────────────────────────
async function updateRenovations(req: Request, db: any, rentRollId: string) {
  const { renovations } = await req.json();
  // renovations: [{ floor_plan_code, renovation_description }]
  for (const r of renovations) {
    await db.from("rent_roll_units").update({ renovation_status: r.renovation_description })
      .eq("rent_roll_id", rentRollId)
      .eq("floor_plan", r.floor_plan_code);
  }
  await db.from("rent_rolls").update({ processing_status: "renovations_done" }).eq("id", rentRollId);
  return json({ success: true });
}

// ─── Affordability ───────────────────────────────────────────────────────────
async function updateAffordability(req: Request, db: any, rentRollId: string) {
  const { has_affordable, lease_types } = await req.json();
  if (has_affordable && lease_types) {
    for (const lt of lease_types) {
      await db.from("rent_roll_units").update({ lease_type: lt.lease_type })
        .eq("rent_roll_id", rentRollId)
        .eq("floor_plan", lt.floor_plan_code);
    }
  }
  await db.from("rent_rolls").update({ processing_status: "affordability_done" }).eq("id", rentRollId);
  return json({ success: true });
}

// ─── Finalize ────────────────────────────────────────────────────────────────
async function finalizeRentRoll(db: any, rentRollId: string) {
  const { data: units } = await db
    .from("rent_roll_units")
    .select("occupancy_status")
    .eq("rent_roll_id", rentRollId);

  const total = units?.length || 0;
  const occupied = units?.filter((u: any) =>
    u.occupancy_status?.toLowerCase() === "occupied" ||
    u.occupancy_status?.toLowerCase() === "current" ||
    u.occupancy_status?.toLowerCase() === "notice-unrented"
  ).length || 0;
  const occupancyPct = total > 0 ? Math.round((occupied / total) * 1000) / 10 : 0;

  // Check for anomalies
  const { data: allUnits } = await db.from("rent_roll_units").select("*").eq("rent_roll_id", rentRollId);
  let hasAnomalies = false;
  for (const u of allUnits || []) {
    if (u.contractual_rent && u.market_rent) {
      const variance = Math.abs(u.contractual_rent - u.market_rent) / u.market_rent;
      if (variance > 0.5) { hasAnomalies = true; break; }
    }
  }

  await db.from("rent_rolls").update({
    processing_status: "finalized",
    total_units: total,
    occupied_units: occupied,
    occupancy_pct: occupancyPct,
    has_anomalies: hasAnomalies,
    raw_data: null, // clear raw data
  }).eq("id", rentRollId);

  return json({ success: true, data: { total_units: total, occupied_units: occupied, occupancy_pct: occupancyPct, has_anomalies: hasAnomalies } });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
async function getDashboard(db: any, rentRollId: string) {
  const { data: units } = await db.from("rent_roll_units").select("*").eq("rent_roll_id", rentRollId);
  if (!units) return json({ success: true, data: {} });

  // Unit types breakdown
  const unitTypes: Record<string, number> = {};
  const leaseTypes: Record<string, number> = {};
  const renovationStatus: Record<string, number> = {};

  for (const u of units) {
    const ut = u.unit_type || "Unknown";
    unitTypes[ut] = (unitTypes[ut] || 0) + 1;
    const lt = u.lease_type || "Market";
    leaseTypes[lt] = (leaseTypes[lt] || 0) + 1;
    const rs = u.renovation_status || "Unrenovated";
    renovationStatus[rs] = (renovationStatus[rs] || 0) + 1;
  }

  return json({
    success: true,
    data: {
      unit_types: Object.entries(unitTypes).map(([name, value]) => ({ name, value })),
      lease_types: Object.entries(leaseTypes).map(([name, value]) => ({ name, value })),
      renovation_status: Object.entries(renovationStatus).map(([name, value]) => ({ name, value })),
      total_units: units.length,
      occupied: units.filter((u: any) => u.occupancy_status?.toLowerCase() !== "vacant").length,
    },
  });
}

// ─── Floor Plan Summary ──────────────────────────────────────────────────────
async function getFloorPlanSummary(db: any, rentRollId: string) {
  const { data: units } = await db.from("rent_roll_units").select("*").eq("rent_roll_id", rentRollId);
  if (!units) return json({ success: true, data: [] });

  const fpMap: Record<string, any> = {};
  for (const u of units) {
    const fp = u.floor_plan || "Unknown";
    if (!fpMap[fp]) {
      fpMap[fp] = {
        floor_plan: fp,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        units: 0,
        occupied: 0,
        vacant: 0,
        avg_sqft: 0,
        avg_market_rent: 0,
        avg_contract_rent: 0,
        total_sqft: 0,
        total_market: 0,
        total_contract: 0,
      };
    }
    fpMap[fp].units++;
    if (u.occupancy_status?.toLowerCase() !== "vacant") fpMap[fp].occupied++;
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

  return json({ success: true, data: summary });
}
