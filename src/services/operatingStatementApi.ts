/**
 * Operating Statement API Service
 * All OS data operations go through the Express backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

function getToken(): string | null {
  return localStorage.getItem('just_deal_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
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
  return json as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OsDocument {
  id: string;
  deal_id: string;
  file_name: string;
  status: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  batch_date: string;
  created_at: string;
}

export interface OsLineItemRow {
  id: string;
  description: string;
  normalized_text?: string;
  mapping_account_id: number | null;
  mapping_account_name?: string;
  mapping_code?: string;
  mapping_source?: string;
  is_expense: boolean;
  is_subtotal: boolean;
  is_section_header: boolean;
  is_negative: boolean;
  mapping_score?: number;
  order_index: number;
  values: Record<string, number>;
}

export interface OsBatchData {
  batch_id: string;
  columns: string[];       // e.g. ["2-2024", "3-2024", ...]
  column_labels: string[];  // e.g. ["Feb 2024", "Mar 2024", ...]
  rows: OsLineItemRow[];
  summary: {
    total_income: Record<string, number>;
    total_expense: Record<string, number>;
    noi: Record<string, number>;
    original_noi?: Record<string, number>;
    noi_variance?: Record<string, number>;
    total_variance?: Record<string, number>;
  };
  is_locked: boolean;
}

export interface ChartOfAccountItem {
  id: number;
  account_name: string;
  code: string;
  category: string;
  is_expense: boolean;
  is_noi: boolean;
  rank: number;
}

export interface MappingSuggestion {
  deal_id: string;
  deal_name: string;
  match_percent: number;
  mapped_items: number;
  total_items: number;
  assigned_to?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export const osUploadApi = {
  upload: async (dealId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dealId', dealId);
    const res = await request<ApiResponse<{ document_id: string; batch_id: string; status: string }>>(
      `/deals/${dealId}/operating-statement/upload`,
      { method: 'POST', body: formData }
    );
    return res.data;
  },

  status: async (dealId: string, documentId: string) => {
    const res = await request<ApiResponse<{ status: string; document_id: string }>>(
      `/deals/${dealId}/operating-statement/documents/${documentId}/status`
    );
    return res.data;
  },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

export const osDataApi = {
  getBatchData: async (dealId: string, batchId?: string) => {
    const path = batchId
      ? `/deals/${dealId}/operating-statement/batch/${batchId}`
      : `/deals/${dealId}/operating-statement/latest`;
    const res = await request<ApiResponse<OsBatchData>>(path);
    return res.data;
  },

  listBatches: async (dealId: string) => {
    const res = await request<ApiResponse<OsDocument[]>>(
      `/deals/${dealId}/operating-statement/batches`
    );
    return res.data;
  },

  updateLineItem: async (dealId: string, lineItemId: string, data: {
    mapping_account_id?: number;
    values?: Record<string, number>;
  }) => {
    const res = await request<ApiResponse<OsLineItemRow>>(
      `/deals/${dealId}/operating-statement/line-items/${lineItemId}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    );
    return res.data;
  },

  saveAll: async (dealId: string, batchId: string, payload: {
    rows: Array<{ id: string; mapping_account_id: number | null; values: Record<string, number> }>;
    first_expense_row?: string;
    noi_row?: string;
    ni_row?: string;
  }) => {
    const res = await request<ApiResponse<{ saved: boolean }>>(
      `/deals/${dealId}/operating-statement/batch/${batchId}/save`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  lockBatch: async (dealId: string, batchId: string) => {
    const res = await request<ApiResponse<{ locked: boolean }>>(
      `/deals/${dealId}/operating-statement/batch/${batchId}/lock`,
      { method: 'POST' }
    );
    return res.data;
  },
};

// ─── Mapping ──────────────────────────────────────────────────────────────────

export const osMappingApi = {
  getChartOfAccounts: async () => {
    const res = await request<ApiResponse<ChartOfAccountItem[]>>(
      `/operating-statement/chart-of-accounts`
    );
    return res.data;
  },

  getBestMatches: async (dealId: string, batchId: string) => {
    const res = await request<ApiResponse<MappingSuggestion[]>>(
      `/deals/${dealId}/operating-statement/batch/${batchId}/best-matches`
    );
    return res.data;
  },

  applyMapping: async (dealId: string, batchId: string, sourceDealId: string) => {
    const res = await request<ApiResponse<{ applied: number }>>(
      `/deals/${dealId}/operating-statement/batch/${batchId}/apply-mapping`,
      { method: 'POST', body: JSON.stringify({ source_deal_id: sourceDealId }) }
    );
    return res.data;
  },
};

// ─── Summary ──────────────────────────────────────────────────────────────────

export const osSummaryApi = {
  getSummary: async (dealId: string, view?: string) => {
    const q = view ? `?view=${encodeURIComponent(view)}` : '';
    const res = await request<ApiResponse<OsBatchData>>(
      `/deals/${dealId}/operating-statement/summary${q}`
    );
    return res.data;
  },
};
