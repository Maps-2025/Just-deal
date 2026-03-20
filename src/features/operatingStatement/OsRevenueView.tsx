import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Loader2, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
  BarChart, Cell,
} from "recharts";

// ── Constants ─────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

const RENT_BY_OPTIONS = [
  { value: "totals",       label: "$ totals" },
  { value: "per_unit",     label: "$ per unit" },
  { value: "per_sf",       label: "$ per sf" },
  { value: "per_occ_unit", label: "$ per occ. unit" },
  { value: "per_occ_sf",   label: "$ per occ. sf" },
];

const RENT_BY_FIELD: Record<string, string> = {
  totals:       "net_rental_income",
  per_unit:     "net_rent_per_unit",
  per_sf:       "net_rent_per_sf",
  per_occ_unit: "net_rent_per_occ_unit",
  per_occ_sf:   "net_rent_per_occ_sf",
};

const RENT_BY_LABEL: Record<string, string> = {
  totals:       "Net Rental Income ($ totals)",
  per_unit:     "Net Rental Income ($ per unit)",
  per_sf:       "Net Rental Income ($ per sf)",
  per_occ_unit: "Net Rental Income ($ per Occ. unit)",
  per_occ_sf:   "Net Rental Income ($ per Occ. sf)",
};

// ── Formatters ────────────────────────────────────────────────────────────
const fmtDollar = (v: number, rentBy: string) => {
  if (v === undefined || v === null) return "";
  if (rentBy === "per_sf" || rentBy === "per_occ_sf")
    return `$${v.toFixed(2)}`;
  const abs = Math.abs(v);
  if (abs >= 1000)
    return v < 0 ? `($${(abs / 1000).toFixed(1)}k)` : `$${(abs / 1000).toFixed(1)}k`;
  return v < 0 ? `($${abs.toFixed(0)})` : `$${abs.toFixed(0)}`;
};

const fmtDollarFull = (v: number, rentBy: string) => {
  if (v === undefined || v === null) return "—";
  if (rentBy === "per_sf" || rentBy === "per_occ_sf")
    return `$ ${v.toFixed(2)}`;
  const abs = Math.abs(v);
  const s = abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return v < 0 ? `($ ${s})` : `$ ${s}`;
};

const fmtPct = (v: number | null) => v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

const fmtOccAxis = (v: number) => `${v.toFixed(0)}%`;

// ── Tooltip components ────────────────────────────────────────────────────
function RentOccTooltip({ active, payload, label, rentBy }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 12px", fontSize: 11, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: 180 }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: "#111827", fontSize: 12 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 16, color: p.color, margin: "2px 0" }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>
            {p.dataKey === "physical_occupancy_pct"
              ? `${p.value.toFixed(1)}%`
              : fmtDollarFull(p.value, rentBy)}
          </span>
        </div>
      ))}
    </div>
  );
}

function YoyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 12px", fontSize: 11, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: "#111827" }}>{label}</p>
      <p style={{ color: v >= 0 ? "#059669" : "#dc2626", fontWeight: 600 }}>{fmtPct(v)}</p>
    </div>
  );
}

// ── Sidebar components ────────────────────────────────────────────────────
function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", marginBottom: 4, marginTop: 0 }}>
      {children}
    </p>
  );
}

function SidebarSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: "100%", height: 27, padding: "0 8px", fontSize: 12, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", outline: "none", color: "#111827", cursor: "pointer" }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #f3f4f6" }}>
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 500, color: "#9ca3af", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      {children}
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ padding: "10px 16px 6px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{title}</p>
          {subtitle && <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{subtitle}</p>}
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", padding: 2 }}>
          <Download style={{ width: 14, height: 14 }} />
        </button>
      </div>
      <div style={{ padding: "12px 16px" }}>{children}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
interface Props { dealId: string; }

export function OsRevenueView({ dealId }: Props) {
  // Filters — rentBy and growthBy are purely local (no API call needed)
  const [view,          setView]          = useState("adjusted");
  const [rentBy,        setRentBy]        = useState("per_occ_unit");
  const [growthBy,      setGrowthBy]      = useState("gross_potential_rent");
  // Date inputs (typing doesn't trigger fetch)
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput,   setEndDateInput]   = useState("");
  // Applied dates (only change on Apply click)
  const [appliedStart,  setAppliedStart]  = useState("");
  const [appliedEnd,    setAppliedEnd]    = useState("");

  // Data
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Only these three cause a real API fetch
  const fetchData = useCallback(async (v: string, sd: string, ed: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: v });
      if (sd) params.set("startDate", sd);
      if (ed) params.set("endDate",   ed);
      const token = localStorage.getItem("just_deal_token") || "";
      const res = await fetch(
        `${BASE_URL}/deals/${dealId}/operating-statement/revenue-analysis?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      setData(json?.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [dealId]);

  // Initial load + when view changes
  useEffect(() => { fetchData(view, appliedStart, appliedEnd); }, [dealId, view]);

  // Helper: apply date filter
  const applyDateFilter = () => {
    setAppliedStart(startDateInput);
    setAppliedEnd(endDateInput);
    fetchData(view, startDateInput, endDateInput);
  };

  const clearDateFilter = () => {
    setStartDateInput("");
    setEndDateInput("");
    setAppliedStart("");
    setAppliedEnd("");
    fetchData(view, "", "");
  };

  // Aliases for template readability
  const startDate = startDateInput;
  const endDate   = endDateInput;

  // Chart 1 data — pick the right field based on rentBy
  const rentOccData = useMemo(() => {
    if (!data?.rent_occupancy) return [];
    const field = RENT_BY_FIELD[rentBy] || "net_rent_per_occ_unit";
    return data.rent_occupancy.map((d: any) => ({
      ...d,
      bar_value: d[field],
    }));
  }, [data, rentBy]);

  // Chart 1 Y-axis domain
  const barMin = useMemo(() => {
    if (!rentOccData.length) return "auto";
    const vals = rentOccData.map((d: any) => d.bar_value).filter(Boolean);
    const min  = Math.min(...vals);
    return Math.floor(min * 0.96);
  }, [rentOccData]);

  const barMax = useMemo(() => {
    if (!rentOccData.length) return "auto";
    const vals = rentOccData.map((d: any) => d.bar_value).filter(Boolean);
    const max  = Math.max(...vals);
    return Math.ceil(max * 1.02);
  }, [rentOccData]);

  // Chart 2 data
  const yoyData = useMemo(() => {
    if (!data?.yoy_growth?.length) return [];
    return data.yoy_growth.map((d: any) => ({
      ...d,
      growth_value: d[growthBy] ?? null,
    }));
  }, [data, growthBy]);

  const growthOptions = data?.growth_options || [];

  // Available date range for picker
  const allMin = data?.meta?.all_min_date; // "2-2024"
  const allMax = data?.meta?.all_max_date;

  const toInputDate = (colKey: string) => {
    if (!colKey) return "";
    const [m, y] = colKey.split("-");
    return `${y}-${m.padStart(2, "0")}-01`;
  };

  if (!initialized || (loading && !data)) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <Loader2 style={{ width: 28, height: 28, color: "hsl(var(--primary))" }} className="animate-spin" />
    </div>
  );

  if (!data?.has_data) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>No Revenue Analysis Data</p>
      <p style={{ fontSize: 12, color: "#6b7280" }}>Upload and finalize an operating statement to see revenue analysis.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", background: "#f4f5f7" }}>

      {/* ── Left Sidebar ─────────────────────────────────────────────── */}
      <div style={{ width: 210, flexShrink: 0, borderRight: "1px solid #e5e7eb", background: "#fff", overflowY: "auto", padding: 0 }}>
        {/* Header */}
        <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid #e5e7eb", marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Report Settings</p>
        </div>

        <div style={{ padding: "0 14px" }}>
          {/* View */}
          <SidebarSection title="View">
            <SidebarField label="">
              <SidebarSelect
                value={view}
                onChange={setView}
                options={[
                  { value: "adjusted", label: "Adjusted Values" },
                  { value: "original", label: "Original Values" },
                ]}
              />
            </SidebarField>
          </SidebarSection>

          {/* Rent & Occupancy */}
          <SidebarSection title="Rent &amp; Occupancy">
            <SidebarField label="View Rent By">
              <SidebarSelect value={rentBy} onChange={setRentBy} options={RENT_BY_OPTIONS} />
            </SidebarField>

            <SidebarField label="Choose Date Range">
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <input
                  type="date"
                  value={startDate}
                  min={toInputDate(allMin)}
                  max={toInputDate(allMax)}
                  onChange={e => setStartDateInput(e.target.value)}
                  style={{ width: "100%", height: 27, fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 6px", background: "#fff", outline: "none", color: "#374151" }}
                />
                <input
                  type="date"
                  value={endDate}
                  min={toInputDate(allMin)}
                  max={toInputDate(allMax)}
                  onChange={e => setEndDateInput(e.target.value)}
                  style={{ width: "100%", height: 27, fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 6px", background: "#fff", outline: "none", color: "#374151" }}
                />
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={applyDateFilter}
                    style={{ flex: 1, height: 26, fontSize: 11, fontWeight: 600, border: "none", borderRadius: 4, background: "#2563eb", color: "#fff", cursor: "pointer" }}
                  >
                    Apply
                  </button>
                  {(startDateInput || endDateInput) && (
                    <button
                      onClick={clearDateFilter}
                      style={{ height: 26, padding: "0 8px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", color: "#374151", cursor: "pointer" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </SidebarField>
          </SidebarSection>

          {/* YOY Growth */}
          <SidebarSection title="Year Over Year Growth by Month">
            <SidebarField label="View Growth By">
              <SidebarSelect value={growthBy} onChange={setGrowthBy} options={growthOptions} />
            </SidebarField>
          </SidebarSection>

          {/* Meta */}
          {data?.meta && (
            <div style={{ marginTop: 4, padding: "10px 0", borderTop: "1px solid #f3f4f6" }}>
              {[
                ["Range",     data.meta.date_range],
                ["Units",     String(data.meta.total_units)],
                ["Occupancy", `${data.meta.occupancy_pct}%`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{k}</span>
                  <span style={{ fontSize: 11, color: "#374151", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 400, color: "#374151", textAlign: "center", marginBottom: 20, letterSpacing: "0.01em" }}>
          Revenue Analysis
        </h2>

        {/* ── Chart 1: Rent & Occupancy ────────────────────────────── */}
        <ChartCard
          title="Rent & Occupancy"
          subtitle={`${RENT_BY_LABEL[rentBy]}   •   Physical Occupancy (%)`}
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={rentOccData} margin={{ top: 4, right: 50, left: 10, bottom: 0 }} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />

              {/* Left Y: rent values */}
              <YAxis
                yAxisId="rent"
                orientation="left"
                domain={[barMin, barMax]}
                tickFormatter={v => {
                  if (rentBy === "per_sf" || rentBy === "per_occ_sf") return `$${v.toFixed(2)}`;
                  if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
                  return `$${v.toFixed(0)}`;
                }}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={64}
              />

              {/* Right Y: occupancy % */}
              <YAxis
                yAxisId="occ"
                orientation="right"
                domain={[99, 101]}
                tickFormatter={fmtOccAxis}
                tick={{ fontSize: 10, fill: "#f97316" }}
                axisLine={false}
                tickLine={false}
                width={36}
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<RentOccTooltip rentBy={rentBy} />} />

              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(v) => v}
              />

              {/* Bars: rent */}
              <Bar
                yAxisId="rent"
                dataKey="bar_value"
                name={`Net Rental Income (${RENT_BY_OPTIONS.find(o => o.value === rentBy)?.label})`}
                fill="#4a90c4"
                radius={[1, 1, 0, 0]}
              />

              {/* Line: occupancy % */}
              <Line
                yAxisId="occ"
                type="monotone"
                dataKey="physical_occupancy_pct"
                name="Physical Occupancy (%)"
                stroke="#f97316"
                strokeWidth={1.5}
                dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 8, textAlign: "center" }}>
            {rentBy === "per_occ_unit" || rentBy === "totals"
              ? "$ per occ. unit is based on total units and physical occupancy."
              : rentBy === "per_occ_sf"
              ? "$ per occ. sf is based on total net SF and physical occupancy."
              : ""}
          </p>
        </ChartCard>

        {/* ── Chart 2: YOY Growth ───────────────────────────────────── */}
        <ChartCard
          title="Year Over Year Growth by Month"
          subtitle={growthOptions.find((o: any) => o.value === growthBy)?.label}
        >
          {!data.has_yoy ? (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                No data available. This chart requires at least 13 months of data.
              </p>
            </div>
          ) : yoyData.length === 0 ? (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 12, color: "#6b7280" }}>Insufficient data for YOY comparison.</p>
            </div>
          ) : (
            <>
              {/* Summary stats above chart */}
              <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                {[
                  { label: "Avg Growth", val: yoyData.reduce((s: number, d: any) => s + (d.growth_value || 0), 0) / yoyData.length },
                  { label: "Best Month", val: Math.max(...yoyData.map((d: any) => d.growth_value || -999)) },
                  { label: "Worst Month", val: Math.min(...yoyData.map((d: any) => d.growth_value || 999)) },
                ].map(({ label, val }) => (
                  <div key={label} style={{ flex: 1, background: "#f9fafb", borderRadius: 4, padding: "6px 10px", textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: val >= 0 ? "#059669" : "#dc2626" }}>
                      {fmtPct(val)}
                    </p>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={yoyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={v => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip content={<YoyTooltip />} />
                  <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
                  <Bar
                    dataKey="growth_value"
                    name="YOY Growth"
                    radius={[2, 2, 0, 0]}
                    fill="#4a90c4"
                    label={{ position: "top", fontSize: 9, fill: "#6b7280", formatter: (v: number) => v !== null ? fmtPct(v) : "" }}
                  >
                    {yoyData.map((entry: any, idx: number) => (
                      <Cell
                        key={idx}
                        fill={(entry.growth_value || 0) >= 0 ? "#3b82f6" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <p style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 4 }}>
                {yoyData[0]?.prev_year} vs {yoyData[0]?.curr_year}
              </p>
            </>
          )}
        </ChartCard>

      </div>
    </div>
  );
}
