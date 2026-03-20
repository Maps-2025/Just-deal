import { useState, useEffect, useMemo } from "react";
import { Loader2, TrendingUp, TrendingDown, Upload } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface Props { dealId: string; onUpload: () => void; }

// ── Formatters ────────────────────────────────────────────────────────────
const fmt = (v: number, perUnit = false, perSf = false): string => {
  if (v === undefined || v === null) return "–";
  if (perSf)  return v === 0 ? "–" : `$${v.toFixed(2)}`;
  const abs = Math.abs(v);
  if (abs === 0) return "–";
  const s = abs >= 1000
    ? abs.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : abs.toFixed(perUnit ? 0 : 0);
  return v < 0 ? `($ ${s})` : `$ ${s}`;
};

const fmtK = (v: number): string => {
  if (!v) return "$0";
  const abs = Math.abs(v);
  const s = abs >= 1000000
    ? `$${(abs / 1000000).toFixed(1)}M`
    : abs >= 1000 ? `$${(abs / 1000).toFixed(0)}k`
    : `$${abs.toFixed(0)}`;
  return v < 0 ? `(${s})` : s;
};

const fmtAxis = (v: number) => {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`;
  return `$${v}`;
};

// ── Row type config ───────────────────────────────────────────────────────
const ROW_STYLE: Record<string, React.CSSProperties> = {
  section:  { background: "#f0f2f5", fontWeight: 700, fontSize: 12, color: "#1e3a5f" },
  subtotal: { background: "#f7f9fb", fontWeight: 600, fontSize: 11.5, color: "#374151" },
  total:    { background: "#e8f0fe", fontWeight: 700, fontSize: 12, color: "#1d4ed8" },
  noi:      { background: "#d1fae5", fontWeight: 800, fontSize: 13, color: "#065f46" },
  net:      { background: "#eff6ff", fontWeight: 700, fontSize: 12, color: "#1e40af" },
  row:      { background: "transparent", fontWeight: 400, fontSize: 11.5, color: "#374151" },
};

// ── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color: string; icon?: React.ReactNode;
}) {
  return (
    <div style={{ flex: 1, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", marginBottom: 6 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon && <span style={{ color }}>{icon}</span>}
        <p style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
      </div>
      {sub && <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 12px", fontSize: 11, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", minWidth: 160 }}>
      <p style={{ fontWeight: 700, color: "#111827", marginBottom: 6, fontSize: 12 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 16, margin: "2px 0" }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 600, color: "#111827" }}>
            {p.dataKey === "noi_pct" ? `${p.value.toFixed(1)}%` : fmtK(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export function OsCashFlowsView({ dealId, onUpload }: Props) {
  const [isPerUnit, setIsPerUnit] = useState(false);
  const [isPerSf,   setIsPerSf]   = useState(false);
  const [isAnnual,  setIsAnnual]  = useState(false);
  const [data,      setData]      = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeChart, setActiveChart] = useState<"area" | "bar">("area");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          isPerUnit: String(isPerUnit),
          isPerSf:   String(isPerSf),
          isAnnual:  String(isAnnual),
        });
        const token = localStorage.getItem("just_deal_token") || "";
        const res = await fetch(`${BASE_URL}/deals/${dealId}/operating-statement/cash-flows?${params}`,
          { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        setData(json?.data || null);
      } catch { setData(null); }
      finally { setLoading(false); }
    };
    load();
  }, [dealId, isPerUnit, isPerSf, isAnnual]);

  const unitLabel = isPerUnit ? " / unit" : isPerSf ? " / sf" : "";

  // ── Row rendering ─────────────────────────────────────────────────────
  const renderValue = (row: any, col: string) => {
    const v = row.values?.[col];
    if (row.type === "section") return null;
    if (v === undefined || v === null) return <span style={{ color: "#d1d5db" }}>–</span>;
    if (v === 0) return <span style={{ color: "#d1d5db" }}>–</span>;
    const isNeg = v < 0;
    const isExp = row.isExpense;
    let color = "#374151";
    if (row.type === "noi")    color = v >= 0 ? "#065f46" : "#dc2626";
    else if (row.type === "net") color = v >= 0 ? "#1e40af" : "#dc2626";
    else if (isNeg)              color = "#dc2626";
    return (
      <span style={{ color, fontVariantNumeric: "tabular-nums" }}>
        {fmt(v, isPerUnit, isPerSf)}
      </span>
    );
  };

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 style={{ width: 28, height: 28 }} className="animate-spin text-primary" />
    </div>
  );

  if (!data?.has_data) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 40 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>No Operating Statement Data</p>
      <p style={{ fontSize: 12, color: "#6b7280" }}>Upload an operating statement to see cash flow analysis.</p>
      <button onClick={onUpload} style={{ height: 32, padding: "0 20px", background: "hsl(200,70%,45%)", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        <Upload style={{ width: 14, height: 14 }} /> Upload
      </button>
    </div>
  );

  const { columns, column_labels, rows, chart_data, meta, summary_kpis } = data;
  const kpis = summary_kpis;

  const LABEL_W  = 200;
  const COL_W    = isAnnual ? 120 : 96;
  const tableW   = LABEL_W + columns.length * COL_W;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "#f4f5f7" }}>

      {/* ── Control bar ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 16px", background: "#fff", borderBottom: "1px solid #e5e7eb", flexShrink: 0, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* View mode */}
          <span style={{ fontSize: 11, color: "#6b7280" }}>View:</span>
          <select
            value={isAnnual ? "annual" : "monthly"}
            onChange={e => setIsAnnual(e.target.value === "annual")}
            style={{ height: 26, padding: "0 8px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", outline: "none" }}
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual (T12)</option>
          </select>

          {/* Units */}
          <span style={{ fontSize: 11, color: "#6b7280" }}>Units:</span>
          <select
            value={isPerUnit ? "per_unit" : isPerSf ? "per_sf" : "totals"}
            onChange={e => {
              setIsPerUnit(e.target.value === "per_unit");
              setIsPerSf(e.target.value === "per_sf");
            }}
            style={{ height: 26, padding: "0 8px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", outline: "none" }}
          >
            <option value="totals">$ totals</option>
            <option value="per_unit">$ / unit</option>
            <option value="per_sf">$ / sf</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#6b7280" }}>Chart:</span>
          {(["area", "bar"] as const).map(t => (
            <button key={t} onClick={() => setActiveChart(t)}
              style={{ height: 26, padding: "0 10px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer",
                background: activeChart === t ? "#2563eb" : "#fff",
                color: activeChart === t ? "#fff" : "#374151" }}>
              {t === "area" ? "Trend" : "Bar"}
            </button>
          ))}
          <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 4 }}>{meta.date_range}</span>
        </div>
      </div>

      {/* ── Content: scrollable ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto" }}>

        {/* KPI strip */}
        <div style={{ display: "flex", gap: 12, padding: "12px 16px 0" }}>
          <KpiCard label="T12 Revenue (EGR)"  value={fmtK(kpis.egr_t12)}  sub={`${meta.num_months} months`} color="#1d4ed8" />
          <KpiCard label="T12 Operating Exp"  value={fmtK(kpis.opex_t12)} sub="Total controllable + non-ctrl" color="#dc2626" />
          <KpiCard label="T12 NOI"            value={fmtK(kpis.noi_t12)}
            icon={kpis.noi_t12 >= 0 ? <TrendingUp style={{width:18,height:18}}/> : <TrendingDown style={{width:18,height:18}}/>}
            sub="Net Operating Income" color={kpis.noi_t12 >= 0 ? "#059669" : "#dc2626"} />
          <KpiCard label="NOI Margin"         value={`${kpis.noi_margin}%`} sub="NOI / EGR" color="#7c3aed" />
        </div>

        {/* Chart */}
        <div style={{ margin: "12px 16px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
              {activeChart === "area" ? "Revenue vs Expenses vs NOI" : "Monthly NOI"}{unitLabel}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            {activeChart === "area" ? (
              <AreaChart data={chart_data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gEgr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gNoi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="egr"  name="Gross Revenue" stroke="#3b82f6" fill="url(#gEgr)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="opex" name="Operating Exp"  stroke="#f97316" fill="transparent"  strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                <Area type="monotone" dataKey="noi"  name="NOI"           stroke="#10b981" fill="url(#gNoi)" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 5 }} />
                <ReferenceLine y={0} stroke="#e5e7eb" />
              </AreaChart>
            ) : (
              <BarChart data={chart_data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke="#e5e7eb" />
                <Bar dataKey="noi" name="NOI" radius={[2,2,0,0]}>
                  {chart_data.map((_: any, i: number) => (
                    <Cell key={i} fill={chart_data[i]?.noi >= 0 ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* ── Spreadsheet table ────────────────────────────────────────── */}
        <div style={{ margin: "0 16px 16px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", minWidth: tableW, width: "100%", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: LABEL_W }} />
                {columns.map((c: string) => <col key={c} style={{ width: COL_W }} />)}
              </colgroup>

              {/* ── Header ──────────────────────────────────────────────── */}
              <thead>
                <tr style={{ background: "#f4f5f7", borderBottom: "2px solid #dde1e7" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", position: "sticky", left: 0, background: "#f4f5f7", zIndex: 2, borderRight: "1px solid #e5e7eb" }}>
                    Line Item
                  </th>
                  {column_labels.map((lbl: string, i: number) => (
                    <th key={i} style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#374151", whiteSpace: "nowrap", borderRight: "1px solid #e5e7eb" }}>
                      {lbl}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* ── Body ────────────────────────────────────────────────── */}
              <tbody>
                {rows.map((row: any, ri: number) => {
                  const style = ROW_STYLE[row.type] || ROW_STYLE.row;
                  const isSpacer = row.type === "spacer";

                  if (isSpacer) return (
                    <tr key={row.id}>
                      <td colSpan={columns.length + 1} style={{ height: 6, background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }} />
                    </tr>
                  );

                  const isSection = row.type === "section";

                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: `1px solid ${isSection ? "#c7d2fe" : "#f0f1f3"}`,
                        height: isSection ? 30 : row.type === "noi" ? 34 : 26,
                        transition: "background 80ms",
                      }}
                      className={!isSection ? "hover:bg-blue-50/30" : ""}
                      onMouseEnter={e => { if (!isSection) (e.currentTarget as HTMLElement).style.background = "#f0f7ff"; }}
                      onMouseLeave={e => { if (!isSection) (e.currentTarget as HTMLElement).style.background = style.background as string || "transparent"; }}
                    >
                      {/* Label cell — sticky */}
                      <td style={{
                        ...style,
                        padding: isSection ? "0 12px" : row.type === "noi" ? "0 12px" : "0 12px 0 20px",
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        borderRight: "1px solid #e5e7eb",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {isSection ? (
                          <span style={{ color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            {row.label}
                          </span>
                        ) : row.label}
                      </td>

                      {/* Value cells */}
                      {columns.map((col: string) => (
                        <td key={col} style={{
                          ...style,
                          padding: "0 10px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontSize: style.fontSize,
                          borderRight: "1px solid #f0f1f3",
                          background: isSection ? "#f0f2f5" : (style.background as string) || "transparent",
                        }}>
                          {!isSection && renderValue(row, col)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
