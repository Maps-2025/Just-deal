/**
 * ============================================================
 * BACKEND SCRIPT FOR CLAUDE AI
 * Complete Rent Roll Analytics Dashboard API
 * ============================================================
 * 
 * Copy this entire file and give it to Claude AI with instructions:
 * "Add this dashboard analytics controller to my Express backend.
 *  I already have the routes file and basic rent roll controller.
 *  Add these new endpoints to serve the dashboard data."
 * 
 * ============================================================
 * DATABASE TABLES USED:
 * - rent_rolls (header/metadata per upload)
 * - rent_roll_units (unit-level data, 1 row per unit)
 * ============================================================
 */

// ─── NEW ROUTE TO ADD IN rentRoll.routes.ts ──────────────────────────────
/*
// Add this route to backend-code/src/routes/rentRoll.routes.ts:

// Enhanced Dashboard (returns all analytics in one call)
router.get('/:dealId/rent-roll/:rrId/dashboard', ctrl.getDashboard);

// Anomalies list
router.get('/:dealId/rent-roll/:rrId/anomalies', ctrl.getAnomalies);

// Resolve anomaly
router.post('/:dealId/rent-roll/:rrId/anomalies/:anomalyId/resolve', ctrl.resolveAnomaly);

// Export to Excel
router.get('/:dealId/rent-roll/:rrId/export', ctrl.exportExcel);

// Historical info
router.get('/:dealId/rent-roll/historicals', ctrl.getHistoricals);

// Units list (already exists but verify)
router.get('/:dealId/rent-roll/:rrId/units', ctrl.getUnits);
*/

// ─── DASHBOARD CONTROLLER (ADD TO rentRoll.controller.ts) ────────────────

/*
Add this getDashboard handler to your existing rentRoll.controller.ts.
It replaces the basic one and returns ALL chart data in a single API call.

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const { dealId, rrId } = req.params;

    // 1. Get rent roll metadata
    const { data: rentRoll, error: rrError } = await supabase
      .from('rent_rolls')
      .select('*')
      .eq('id', rrId)
      .single();

    if (rrError || !rentRoll) {
      return res.status(404).json({ success: false, message: 'Rent roll not found' });
    }

    // 2. Get all units for this rent roll
    const { data: units, error: unitsError } = await supabase
      .from('rent_roll_units')
      .select('*')
      .eq('rent_roll_id', rrId);

    if (unitsError) {
      return res.status(500).json({ success: false, message: unitsError.message });
    }

    const allUnits = units || [];
    const totalUnits = allUnits.length;

    // ─── COMPUTE ANALYTICS ──────────────────────────────────────────

    // Unit Types (group by bedrooms)
    const unitTypeMap = new Map<string, number>();
    allUnits.forEach(u => {
      const key = u.bedrooms != null ? `${u.bedrooms} Bed` : 'Unknown';
      unitTypeMap.set(key, (unitTypeMap.get(key) || 0) + 1);
    });
    const unit_types = Array.from(unitTypeMap.entries()).map(([name, value]) => ({ name, value }));

    // Lease Types (group by lease_type)
    const leaseTypeMap = new Map<string, number>();
    allUnits.forEach(u => {
      const key = u.lease_type || 'Market';
      leaseTypeMap.set(key, (leaseTypeMap.get(key) || 0) + 1);
    });
    const lease_types = Array.from(leaseTypeMap.entries()).map(([name, value]) => ({ name, value }));

    // Renovation Status (group by renovation_status)
    const renovationMap = new Map<string, number>();
    allUnits.forEach(u => {
      const key = u.renovation_status || 'Unrenovated';
      renovationMap.set(key, (renovationMap.get(key) || 0) + 1);
    });
    const renovation_status = Array.from(renovationMap.entries()).map(([name, value]) => ({ name, value }));

    // Occupancy
    const occupiedUnits = allUnits.filter(u =>
      u.occupancy_status?.toLowerCase() === 'occupied' ||
      u.occupancy_status?.toLowerCase() === 'current'
    );
    const occupied = occupiedUnits.length;
    const vacant = totalUnits - occupied;
    const occupancy_pct = totalUnits > 0 ? (occupied / totalUnits) * 100 : 0;

    // Rent Metrics
    const occupiedWithRent = occupiedUnits.filter(u => u.contractual_rent != null);
    const allWithMarket = allUnits.filter(u => u.market_rent != null);

    const total_monthly_rent = occupiedWithRent.reduce((sum, u) => sum + (u.contractual_rent || 0), 0);
    const total_market_rent = allWithMarket.reduce((sum, u) => sum + (u.market_rent || 0), 0);
    const avg_in_place_rent = occupiedWithRent.length > 0
      ? total_monthly_rent / occupiedWithRent.length : 0;
    const avg_market_rent = allWithMarket.length > 0
      ? total_market_rent / allWithMarket.length : 0;

    // Loss to Lease (for occupied units with both rents)
    const lossUnits = occupiedUnits.filter(u => u.market_rent != null && u.contractual_rent != null);
    const loss_to_lease = lossUnits.reduce((sum, u) =>
      sum + Math.max(0, (u.market_rent || 0) - (u.contractual_rent || 0)), 0);
    const loss_to_lease_pct = total_market_rent > 0
      ? (loss_to_lease / total_market_rent) * 100 : 0;

    // Vacancy Loss
    const vacantUnits = allUnits.filter(u =>
      u.occupancy_status?.toLowerCase() === 'vacant' ||
      u.occupancy_status?.toLowerCase() === 'vacant-unrented'
    );
    const vacancy_loss = vacantUnits.reduce((sum, u) => sum + (u.market_rent || 0), 0);

    // Monthly Rent by Floor Plan
    const fpMap = new Map<string, { in_place_sum: number; market_sum: number; sqft_sum: number; count: number }>();
    allUnits.forEach(u => {
      const fp = u.floor_plan || 'Unknown';
      const cur = fpMap.get(fp) || { in_place_sum: 0, market_sum: 0, sqft_sum: 0, count: 0 };
      cur.in_place_sum += (u.contractual_rent || 0);
      cur.market_sum += (u.market_rent || 0);
      cur.sqft_sum += (u.net_sqft || 0);
      cur.count += 1;
      fpMap.set(fp, cur);
    });
    const monthly_rent = Array.from(fpMap.entries()).map(([floor_plan, d]) => ({
      floor_plan,
      in_place: d.count > 0 ? Math.round(d.in_place_sum / d.count) : 0,
      market: d.count > 0 ? Math.round(d.market_sum / d.count) : 0,
      in_place_total: Math.round(d.in_place_sum),
      market_total: Math.round(d.market_sum),
      in_place_psf: d.sqft_sum > 0 ? Math.round((d.in_place_sum / d.sqft_sum) * 100) / 100 : 0,
      market_psf: d.sqft_sum > 0 ? Math.round((d.market_sum / d.sqft_sum) * 100) / 100 : 0,
      units: d.count,
    }));

    // Lease Expiration Schedule
    const leaseExpMap = new Map<string, { count: number; rent: number }>();
    allUnits.forEach(u => {
      if (!u.lease_end_date) return;
      const d = new Date(u.lease_end_date);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cur = leaseExpMap.get(month) || { count: 0, rent: 0 };
      cur.count += 1;
      cur.rent += (u.contractual_rent || 0);
      leaseExpMap.set(month, cur);
    });
    const lease_expiration = Array.from(leaseExpMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => ({
        month,
        count: d.count,
        pct_units: totalUnits > 0 ? Math.round((d.count / totalUnits) * 1000) / 10 : 0,
        pct_rent: total_monthly_rent > 0 ? Math.round((d.rent / total_monthly_rent) * 1000) / 10 : 0,
      }));

    // Loss to Lease by Floor Plan
    const lossByFp = Array.from(fpMap.entries()).map(([name, d]) => ({
      name,
      loss: Math.max(0, d.market_sum - d.in_place_sum),
    }));

    // Renovation Premium
    const renovRentMap = new Map<string, { sum: number; count: number }>();
    allUnits.forEach(u => {
      const status = u.renovation_status || 'Unrenovated';
      const cur = renovRentMap.get(status) || { sum: 0, count: 0 };
      cur.sum += (u.contractual_rent || 0);
      cur.count += 1;
      renovRentMap.set(status, cur);
    });
    const renovation_premium = Array.from(renovRentMap.entries()).map(([status, d]) => ({
      status,
      avg_rent: d.count > 0 ? Math.round(d.sum / d.count) : 0,
    }));

    const rent_by_renovation = renovation_premium.map(r => ({
      status: r.status,
      rent: r.avg_rent,
    }));

    // Occupancy by Unit Type
    const occByType = new Map<string, { occupied: number; vacant: number }>();
    allUnits.forEach(u => {
      const type = u.bedrooms != null ? `${u.bedrooms} Bed` : 'Unknown';
      const cur = occByType.get(type) || { occupied: 0, vacant: 0 };
      const isOccupied = u.occupancy_status?.toLowerCase() === 'occupied' ||
                         u.occupancy_status?.toLowerCase() === 'current';
      if (isOccupied) cur.occupied += 1;
      else cur.vacant += 1;
      occByType.set(type, cur);
    });
    const occupancy_by_type = Array.from(occByType.entries()).map(([name, d]) => ({
      name,
      occupied: d.occupied,
      vacant: d.vacant,
    }));

    // Leasing Trends (from lease_start_date)
    const trendMap = new Map<string, number>();
    allUnits.forEach(u => {
      if (!u.lease_start_date) return;
      const d = new Date(u.lease_start_date);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      trendMap.set(month, (trendMap.get(month) || 0) + 1);
    });
    const leasing_trends = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, leases]) => ({ month, leases }));

    // Feature Flags / Settings
    const hasLeaseTypes = lease_types.length > 1 || !lease_types.every(lt => lt.name === 'Market');
    const hasRenovations = renovation_status.length > 1 || !renovation_status.every(r => r.name === 'Unrenovated');
    const hasLeaseDates = allUnits.some(u => u.lease_end_date != null);
    const hasLeaseSignDate = allUnits.some(u => u.lease_start_date != null);
    const hasMoveInDate = allUnits.some(u => u.move_in_date != null);
    const hasBeds = allUnits.some(u => u.bedrooms != null);
    const hasBaths = allUnits.some(u => u.bathrooms != null);
    const hasNetSf = allUnits.some(u => u.net_sqft != null && u.net_sqft > 0);

    const settings = {
      hasLeaseTypes,
      hasRenovations,
      hasLeaseDates,
      hasLeaseSignDate,
      hasMoveInDate,
      hasBeds,
      hasBaths,
      hasNetSf,
      rentTypes: [...new Set(allUnits.map(u => u.lease_type || 'Market'))],
      renovationStatuses: [...new Set(allUnits.map(u => u.renovation_status || 'Unrenovated'))],
    };

    // ─── RETURN RESPONSE ─────────────────────────────────────────────
    return res.json({
      success: true,
      data: {
        unit_types,
        lease_types,
        renovation_status,
        total_units: totalUnits,
        occupied,
        vacant,
        occupancy_pct: Math.round(occupancy_pct * 10) / 10,
        avg_market_rent: Math.round(avg_market_rent),
        avg_in_place_rent: Math.round(avg_in_place_rent),
        total_monthly_rent: Math.round(total_monthly_rent),
        total_market_rent: Math.round(total_market_rent),
        loss_to_lease: Math.round(loss_to_lease),
        loss_to_lease_pct: Math.round(loss_to_lease_pct * 10) / 10,
        vacancy_loss: Math.round(vacancy_loss),
        monthly_rent,
        lease_expiration,
        loss_to_lease_by_fp: lossByFp,
        renovation_premium,
        rent_by_renovation,
        occupancy_by_type,
        leasing_trends,
        settings,
      },
    });
  } catch (err: any) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ─── ANOMALIES CONTROLLER ────────────────────────────────────────────────

export const getAnomalies = async (req: Request, res: Response) => {
  try {
    const { rrId } = req.params;

    const { data: units, error } = await supabase
      .from('rent_roll_units')
      .select('id, unit_no, market_rent, contractual_rent, occupancy_status')
      .eq('rent_roll_id', rrId);

    if (error) return res.status(500).json({ success: false, message: error.message });

    const anomalies: any[] = [];
    (units || []).forEach(u => {
      // Missing contractual rent for occupied unit
      if (
        (!u.contractual_rent || u.contractual_rent === 0) &&
        (u.occupancy_status?.toLowerCase() === 'occupied' || u.occupancy_status?.toLowerCase() === 'current')
      ) {
        anomalies.push({
          unit_id: u.id,
          unit_no: u.unit_no || '?',
          anomaly_type: 'missing_rent',
          message: 'This unit has no Contractual Rent',
          severity: 'warning',
        });
      }

      // Contractual rent > 30% below market
      if (u.market_rent && u.contractual_rent && u.contractual_rent < u.market_rent * 0.7) {
        anomalies.push({
          unit_id: u.id,
          unit_no: u.unit_no || '?',
          anomaly_type: 'below_market',
          message: `Contractual Rent ($${u.contractual_rent}) is more than 30% below Market Rent ($${u.market_rent})`,
          severity: 'warning',
        });
      }

      // Negative rent
      if (u.contractual_rent && u.contractual_rent < 0) {
        anomalies.push({
          unit_id: u.id,
          unit_no: u.unit_no || '?',
          anomaly_type: 'negative_rent',
          message: 'This unit has negative Contractual Rent',
          severity: 'error',
        });
      }
    });

    return res.json({ success: true, data: anomalies });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ─── HISTORICALS CONTROLLER ──────────────────────────────────────────────

export const getHistoricals = async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;

    const { data: rentRolls, error } = await supabase
      .from('rent_rolls')
      .select('id, report_date')
      .eq('deal_pk', dealId)
      .order('report_date', { ascending: false });

    if (error) return res.status(500).json({ success: false, message: error.message });

    return res.json({
      success: true,
      data: {
        rent_roll_count: (rentRolls || []).length,
        latest_date: rentRolls?.[0]?.report_date || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ─── UNITS LIST (if not already implemented) ─────────────────────────────

export const getUnits = async (req: Request, res: Response) => {
  try {
    const { rrId } = req.params;

    const { data: units, error } = await supabase
      .from('rent_roll_units')
      .select('*')
      .eq('rent_roll_id', rrId)
      .order('unit_no', { ascending: true });

    if (error) return res.status(500).json({ success: false, message: error.message });

    return res.json({ success: true, data: units || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
*/

/**
 * ============================================================
 * ROUTES TO ADD (backend-code/src/routes/rentRoll.routes.ts)
 * ============================================================
 * 
 * // Anomalies
 * router.get('/:dealId/rent-roll/:rrId/anomalies', ctrl.getAnomalies);
 * 
 * // Historicals
 * router.get('/:dealId/rent-roll/historicals', ctrl.getHistoricals);
 * 
 * // Export
 * router.get('/:dealId/rent-roll/:rrId/export', ctrl.exportExcel);
 * 
 * NOTE: The existing dashboard route should be updated to use 
 * the enhanced getDashboard controller above.
 * ============================================================
 */

/**
 * ============================================================
 * SQL INDEXES (Run in Supabase SQL editor for performance)
 * ============================================================
 * 
 * CREATE INDEX IF NOT EXISTS idx_rru_rent_roll_id ON rent_roll_units(rent_roll_id);
 * CREATE INDEX IF NOT EXISTS idx_rru_lease_end ON rent_roll_units(lease_end_date);
 * CREATE INDEX IF NOT EXISTS idx_rru_floor_plan ON rent_roll_units(floor_plan);
 * CREATE INDEX IF NOT EXISTS idx_rr_deal_pk ON rent_rolls(deal_pk);
 * 
 * ============================================================
 */
