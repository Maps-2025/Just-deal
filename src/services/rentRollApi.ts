/**
 * Rent Roll Capture API — calls Express backend at localhost:3001
 * All endpoints go through: /api/v1/deals/:dealId/rent-roll/...
 */

import { getToken } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

async function rrRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({ message: res.statusText }));
  if (!res.ok) {
    const err = new Error(json.message || json.error || 'API error') as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return json as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UploadResponse {
  success: boolean;
  data: {
    rent_roll_id: string;
    headers: string[];
    row_count: number;
    preview: any[][];
  };
}

export interface FloorplanRow {
  floor_plan_code: string;
  unit_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  units: number;
  net_sqft: number;
  market_rent: number;
  floor_plan_name: string;
}

export interface OccupancyRow {
  occupancy_code: string;
  total_units: number;
  total_charges: number;
  occupancy_status: string;
}

export interface ChargeRow {
  charge_code: string;
  total_amount: number;
  charge_category: string;
}

export interface RentRollRecord {
  id: string;
  deal_pk: string;
  report_date: string;
  uploaded_at: string;
  has_anomalies: boolean;
  total_units: number | null;
  occupied_units: number | null;
  occupancy_pct: number | null;
  processing_status: string;
}

export interface DashboardData {
  unit_types: { name: string; value: number }[];
  lease_types: { name: string; value: number }[];
  renovation_status: { name: string; value: number }[];
  total_units: number;
  occupied: number;
}

export interface FloorPlanSummaryRow {
  floor_plan: string;
  bedrooms: number | null;
  bathrooms: number | null;
  units: number;
  occupied: number;
  vacant: number;
  occupancy_pct: number;
  avg_sqft: number;
  avg_market_rent: number;
  avg_contract_rent: number;
}

export interface RentRollUnitRow {
  id: string;
  unit_no: string | null;
  floor_plan: string | null;
  net_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  unit_type: string | null;
  lease_type: string | null;
  renovation_status: string | null;
  occupancy_status: string | null;
  market_rent: number | null;
  contractual_rent: number | null;
  recurring_concessions: number | null;
  net_effective_rent: number | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  tenant_name: string | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export const rentRollCaptureApi = {
  /** Upload Excel file */
  upload: (dealId: string, file: File, totalUnits: number, reportDate?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('totalUnits', String(totalUnits));
    if (reportDate) formData.append('reportDate', reportDate);
    return rrRequest<UploadResponse>(`/deals/${dealId}/rent-roll/upload`, { method: 'POST', body: formData });
  },

  /** List rent rolls for a deal */
  list: async (dealId: string) => {
    const res = await rrRequest<{ success: boolean; data: RentRollRecord[] }>(`/deals/${dealId}/rent-roll`);
    return res.data;
  },

  /** Get single rent roll */
  get: async (dealId: string, rentRollId: string) => {
    const res = await rrRequest<{ success: boolean; data: RentRollRecord }>(`/deals/${dealId}/rent-roll/${rentRollId}`);
    return res.data;
  },

  /** Delete rent roll */
  delete: (dealId: string, rentRollId: string) =>
    rrRequest<{ success: boolean }>(`/deals/${dealId}/rent-roll/${rentRollId}`, { method: 'DELETE' }),

  /** Save column mapping */
  saveMapping: (dealId: string, rentRollId: string, mapping: Record<string, string>) =>
    rrRequest<{ success: boolean; data: { units_created: number } }>(`/deals/${dealId}/rent-roll/${rentRollId}/mapping`, {
      method: 'POST',
      body: JSON.stringify({ mapping }),
    }),

  /** Get floor plans */
  getFloorplans: async (dealId: string, rentRollId: string) => {
    const res = await rrRequest<{ success: boolean; data: FloorplanRow[] }>(`/deals/${dealId}/rent-roll/${rentRollId}/floorplans`);
    return res.data;
  },

  /** Update floor plans */
  updateFloorplans: (dealId: string, rentRollId: string, floorplans: FloorplanRow[]) =>
    rrRequest<{ success: boolean }>(`/deals/${dealId}/rent-roll/${rentRollId}/floorplans`, {
      method: 'PUT',
      body: JSON.stringify({ floorplans }),
    }),

  /** Get occupancy */
  getOccupancy: async (dealId: string, rentRollId: string) => {
    const res = await rrRequest<{ success: boolean; data: OccupancyRow[] }>(`/deals/${dealId}/rent-roll/${rentRollId}/occupancy`);
    return res.data;
  },

  /** Update occupancy */
  updateOccupancy: (dealId: string, rentRollId: string, occupancy: OccupancyRow[]) =>
    rrRequest<{ success: boolean }>(`/deals/${dealId}/rent-roll/${rentRollId}/occupancy`, {
      method: 'PUT',
      body: JSON.stringify({ occupancy }),
    }),

  /** Get charges */
  getCharges: async (dealId: string, rentRollId: string) => {
    const res = await rrRequest<{ success: boolean; data: ChargeRow[] }>(`/deals/${dealId}/rent-roll/${rentRollId}/charges`);
    return res.data;
  },

  /** Update charges */
  updateCharges: (dealId: string, rentRollId: string, charges: ChargeRow[]) =>
    rrRequest<{ success: boolean }>(`/deals/${dealId}/rent-roll/${rentRollId}/charges`, {
      method: 'PUT',
      body: JSON.stringify({ charges }),
    }),

  /** Save renovations */
  updateRenovations: (dealId: string, rentRollId: string, renovations: { floor_plan_code: string; renovation_description: string }[]) =>
    rrRequest<{ success: boolean }>(`/deals/${dealId}/rent-roll/${rentRollId}/renovations`, {
      method: 'PUT',
      body: JSON.stringify({ renovations }),
    }),

  /** Save affordability */
  updateAffordability: (dealId: string, rentRollId: string, hasAffordable: boolean, leaseTypes?: { floor_plan_code: string; lease_type: string }[]) =>
    rrRequest<{ success: boolean }>(`/deals/${dealId}/rent-roll/${rentRollId}/affordability`, {
      method: 'PUT',
      body: JSON.stringify({ has_affordable: hasAffordable, lease_types: leaseTypes }),
    }),

  /** Finalize rent roll */
  finalize: async (dealId: string, rentRollId: string) => {
    const res = await rrRequest<{ success: boolean; data: any }>(`/deals/${dealId}/rent-roll/${rentRollId}/finalize`, { method: 'POST' });
    return res.data;
  },

  /** Get dashboard data */
  getDashboard: async (dealId: string, rentRollId: string) => {
    const res = await rrRequest<{ success: boolean; data: DashboardData }>(`/deals/${dealId}/rent-roll/${rentRollId}/dashboard`);
    return res.data;
  },

  /** Get all units */
  getUnits: async (dealId: string, rentRollId: string) => {
    const res = await rrRequest<{ success: boolean; data: RentRollUnitRow[] }>(`/deals/${dealId}/rent-roll/${rentRollId}/units`);
    return res.data;
  },

  /** Get floor plan summary */
  getFloorPlanSummary: async (dealId: string, rentRollId: string) => {
    const res = await rrRequest<{ success: boolean; data: FloorPlanSummaryRow[] }>(`/deals/${dealId}/rent-roll/${rentRollId}/floor-plan-summary`);
    return res.data;
  },
};
