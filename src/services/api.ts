/**
 * Just Deal — API Service Layer
 * ALL data fetching goes through the Express backend.
 * No direct Supabase calls in the frontend.
 *
 * Backend base URL: http://localhost:3001/api/v1
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// ─── Token helpers ────────────────────────────────────────────────────────────
export function saveToken(token: string) {
  localStorage.setItem('just_deal_token', token);
}
export function getToken(): string | null {
  return localStorage.getItem('just_deal_token');
}
export function clearToken() {
  localStorage.removeItem('just_deal_token');
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({ message: res.statusText }));

  if (!res.ok) {
    const err = new Error(json.message || 'API error') as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  // Backend wraps all responses: { success, data, meta?, timestamp }
  return json as T;
}

function qs(params: Record<string, unknown> = {}): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) v.forEach((val) => q.append(k, String(val)));
    else q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// ─── Response types ───────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

// ─── Domain types (matching your Supabase schema exactly) ─────────────────────
export interface Deal {
  id: string;
  organization_id: string;
  deal_id: string;
  deal_name: string;
  status: string;
  asset_type: string;
  deal_type: string | null;
  fund: string | null;
  bid_due_date: string | null;
  due_diligence_date: string | null;
  broker: string | null;
  broker_email: string | null;
  broker_phone: string | null;
  comments: string | null;
  is_starred: boolean;
  flags_r: boolean;
  flags_h: boolean;
  flags_m: boolean;
  date_added: string;
  date_modified: string;
  // joined relations
  property?: Property | null;
  rent_rolls?: RentRollSummary[];
  operating_statements?: OsSummary[];
}

export interface Property {
  id: string;
  deal_pk: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  market: string | null;
  building_type: string | null;
  year_built: number | null;
  year_renovated: number | null;
  buildings: number | null;
  stories: number | null;
  residential_sqft: number | null;
  total_units: number | null;
  acres: number | null;
  parking_spaces: number | null;
  asset_quality: string | null;
  location_quality: string | null;
  age_restricted: boolean | null;
  affordable_units_pct: number | null;
  affordability_status: string | null;
  multifamily_housing_type: string | null;
  property_manager: string | null;
  amenities: Record<string, unknown>;
}

export interface RentRollSummary {
  id: string;
  report_date: string;
  uploaded_at: string;
  total_units: number | null;
  occupied_units: number | null;
  occupancy_pct: number | null;
  has_anomalies: boolean;
}

export interface RentRollUnit {
  id: string;
  rent_roll_id: string;
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
  move_in_date: string | null;
  move_out_date: string | null;
  tenant_name: string | null;
  lease_term_months: number | null;
}

export interface UnitMixRow {
  floor_plan: string;
  bedrooms: number | null;
  count: number;
  occupied: number;
  avg_sqft: number;
  avg_market_rent: number;
  avg_contract_rent: number;
  occupancy_pct: number;
}

export interface OsSummary {
  id: string;
  period_start: string;
  period_end: string;
  period_type: string;
  budget_type: string;
  uploaded_at: string;
}

export interface OsLineItem {
  id: string;
  account_name: string;
  account_code: string | null;
  category: string | null;
  is_income: boolean;
  amount: number;
}

export interface OperatingStatement extends OsSummary {
  line_items: OsLineItem[];
}

export interface NOISummary {
  os_id: string;
  period: string;
  budget_type: string;
  effective_gross_income: number;
  total_expenses: number;
  noi: number;
  expense_ratio: number;
}

export interface DealStats {
  total: number;
  by_status: { status: string; count: number }[];
  by_fund: { fund: string; count: number }[];
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await request<ApiResponse<{ access_token: string; user: unknown }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.access_token) saveToken(res.data.access_token);
    return res.data;
  },

  register: async (email: string, password: string, name: string, organization_name: string) => {
    const res = await request<ApiResponse<{ access_token: string; user: unknown }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, organization_name }),
    });
    if (res.data?.access_token) saveToken(res.data.access_token);
    return res.data;
  },

  me: async () => {
    const res = await request<ApiResponse<unknown>>('/auth/me');
    return res.data;
  },

  logout: () => clearToken(),
};

// ─── Deals API ────────────────────────────────────────────────────────────────
export interface GetDealsParams {
  search?: string;
  status?: string | string[];
  market?: string;
  fund?: string;
  starred?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const dealsApi = {
  list: (params: GetDealsParams = {}) =>
    request<PaginatedApiResponse<Deal>>(`/deals${qs(params as unknown as Record<string, unknown>)}`),

  get: async (id: string) => {
    const res = await request<ApiResponse<Deal>>(`/deals/${id}`);
    return res.data;
  },

  stats: async () => {
    const res = await request<ApiResponse<DealStats>>('/deals/stats');
    return res.data;
  },

  statusCategories: async () => {
    const res = await request<ApiResponse<{ status: string; count: number }[]>>('/deals/status-categories');
    return res.data;
  },

  create: async (data: Partial<Deal> & {
    deal_id: string; deal_name: string; status: string; asset_type: string; organization_id: string;
    address?: string; city?: string; state?: string; zip?: string; market?: string;
  }) => {
    const res = await request<ApiResponse<Deal>>('/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  update: async (id: string, data: Partial<Deal>) => {
    const res = await request<ApiResponse<Deal>>(`/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  updateStatus: async (id: string, status: string) => {
    const res = await request<ApiResponse<Deal>>(`/deals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  toggleStar: async (id: string) => {
    const res = await request<ApiResponse<{ id: string; is_starred: boolean }>>(`/deals/${id}/star`, {
      method: 'PATCH',
    });
    return res.data;
  },

  delete: async (id: string) => {
    const res = await request<ApiResponse<{ id: string; deleted: boolean }>>(`/deals/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },
};

// ─── Properties API ───────────────────────────────────────────────────────────
export const propertiesApi = {
  get: async (dealId: string) => {
    const res = await request<ApiResponse<Property>>(`/deals/${dealId}/property`);
    return res.data;
  },

  upsert: async (dealId: string, data: Partial<Property>) => {
    const res = await request<ApiResponse<Property>>(`/deals/${dealId}/property`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};

// ─── Rent Roll API ────────────────────────────────────────────────────────────
export interface GetUnitsParams {
  page?: number;
  limit?: number;
  search?: string;
  occupancy_status?: string;
  floor_plan?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const rentRollApi = {
  list: async (dealId: string) => {
    const res = await request<ApiResponse<RentRollSummary[]>>(`/deals/${dealId}/rent-roll`);
    return res.data;
  },

  latest: async (dealId: string) => {
    const res = await request<ApiResponse<RentRollSummary>>(`/deals/${dealId}/rent-roll/latest`);
    return res.data;
  },

  units: (dealId: string, params: GetUnitsParams = {}) =>
    request<PaginatedApiResponse<RentRollUnit> & { rent_roll: RentRollSummary }>(
      `/deals/${dealId}/rent-roll/units${qs(params as unknown as Record<string, unknown>)}`
    ),

  unitMix: async (dealId: string) => {
    const res = await request<ApiResponse<{ rent_roll_id: string; report_date: string; unit_mix: UnitMixRow[] }>>(
      `/deals/${dealId}/rent-roll/unit-mix`
    );
    return res.data;
  },
};

// ─── Operating Statement API ──────────────────────────────────────────────────
export const operatingStatementApi = {
  list: async (dealId: string, params: { budget_type?: string; period_type?: string } = {}) => {
    const res = await request<ApiResponse<OsSummary[]>>(
      `/deals/${dealId}/operating-statement${qs(params)}`
    );
    return res.data;
  },

  latest: async (dealId: string, budgetType?: string) => {
    const res = await request<ApiResponse<OperatingStatement>>(
      `/deals/${dealId}/operating-statement/latest${budgetType ? `?budget_type=${encodeURIComponent(budgetType)}` : ''}`
    );
    return res.data;
  },

  get: async (dealId: string, osId: string) => {
    const res = await request<ApiResponse<OperatingStatement>>(
      `/deals/${dealId}/operating-statement/${osId}`
    );
    return res.data;
  },

  noi: async (dealId: string) => {
    const res = await request<ApiResponse<NOISummary>>(
      `/deals/${dealId}/operating-statement/noi-summary`
    );
    return res.data;
  },
};
