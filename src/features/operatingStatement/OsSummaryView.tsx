import { useState, useEffect } from "react";
import { FileSpreadsheet, Loader2, Upload, Download, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { osDataApi } from "@/services/operatingStatementApi";

interface Props {
  dealId: string;
  onUpload: () => void;
  onNavigate?: (view: string) => void;
}

interface HistoricalRow {
  description: string;
  t12: number;
  t3: number;
  t1: number;
  bold?: boolean;
  italic?: boolean;
  is_ratio?: boolean;
}

interface MonthlyPoint {
  label: string;
  base_rental: number;
  other_income: number;
  total_revenue: number;
  total_expense: number;
  noi: number;
}

interface ExpenseSlice {
  name: string;
  value: number;
  color: string;
}

interface AnalyticsData {
  batch_id: string;
  date_range: string;
  monthly_data: MonthlyPoint[];
  historical_perf: HistoricalRow[];
  expense_breakdown: ExpenseSlice[];
  summary: { egr_t12: number; total_exp_t12: number; noi_t12: number };
}

// ── Number formatters ──────────────────────────────────────────────────────
const fmtDollar = (v: number) => {
  if (!v && v !== 0) return "—";
  const abs = Math.abs(v);
  const s = abs >= 1000
    ? `$ ${(abs / 1000).toFixed(abs >= 100000 ? 0 : 1)}k`
    : `$ ${abs.toLocaleString()}`;
  return v < 0 ? `(${s})` : s;
};
const fmtFull = (v: number) => {
  if (!v && v !== 0) return "—";
  const abs = Math.abs(v);
  const s = `$ ${abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  return v < 0 ? `(${s})` : s;
};
const fmtPct  = (v: number) => `${v.toFixed(1)}%`;
const fmtAxis = (v: number) => {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`;
  return `$${v}`;
};

// ── Tooltip components ────────────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: "#111827" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: {fmtFull(p.value)}
        </p>
      ))}
    </div>
  );
};

const LineTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: "#111827" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: {fmtFull(p.value)}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <p style={{ fontWeight: 600, color: p.payload.color }}>{p.name}</p>
      <p style={{ color: "#374151", margin: "2px 0" }}>{fmtFull(p.value)}</p>
      <p style={{ color: "#6b7280", fontSize: 11 }}>{fmtPct(p.payload.percent * 100)}</p>
    </div>
  );
};

// ── Custom pie label ───────────────────────────────────────────────────────
const PieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = outerRadius + 18;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fontSize={10} fill="#374151" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
      {fmtPct(percent * 100)}
    </text>
  );
};

// ── Card wrapper ───────────────────────────────────────────────────────────
function Card({ title, children, onDownload }: { title: string; children: React.ReactNode; onDownload?: () => void }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{title}</span>
        {onDownload && (
          <button onClick={onDownload} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", padding: 2 }}>
            <Download className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

// ── KPI strip at top ───────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ flex: 1, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 700, color: color || "#111827", lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function OsSummaryView({ dealId, onUpload, onNavigate }: Props) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState("total");
  const [activeExpSlice, setActiveExpSlice] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1"}/deals/${dealId}/operating-statement/summary-analytics`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("just_deal_token") || ""}` } }
        );
        const json = await res.json();
        setAnalytics(json?.data || null);
      } catch {
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dealId]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    </div>
  );

  if (!analytics) return (
    <div className="flex-1 overflow-auto p-5">
      <div className="max-w-2xl mx-auto">
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "48px 24px", textAlign: "center", background: "#fff" }}>
          <FileSpreadsheet style={{ width: 40, height: 40, margin: "0 auto 12px", color: "#d1d5db" }} />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 6 }}>No Operating Statement</h3>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>
            Upload an operating statement to see income, expense and NOI analysis across all 4 charts.
          </p>
          <button
            onClick={onUpload}
            style={{ height: 32, padding: "0 20px", fontSize: 12, fontWeight: 600, borderRadius: 6, color: "#fff", background: "hsl(200,70%,45%)", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Upload style={{ width: 14, height: 14 }} />
            Upload Operating Statement
          </button>
        </div>
      </div>
    </div>
  );

  const md = analytics.monthly_data;
  const sm = analytics.summary;

  // NOI trend direction
  const lastNoi  = md[md.length - 1]?.noi ?? 0;
  const firstNoi = md[0]?.noi ?? 0;
  const noiTrend = lastNoi >= firstNoi;

  return (
    <div className="flex-1 overflow-auto" style={{ background: "#f4f5f7" }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
          Operating Statement Summary
          {analytics.date_range && (
            <span style={{ fontSize: 11, fontWeight: 400, color: "#6b7280", marginLeft: 8 }}>
              {analytics.date_range}
            </span>
          )}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#6b7280" }}>View:</span>
          <select value={view} onChange={e => setView(e.target.value)}
            style={{ height: 24, padding: "0 6px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", outline: "none" }}>
            <option value="total">$ Total</option>
            <option value="per_unit">$ Per Unit</option>
          </select>
          <button
            onClick={onUpload}
            style={{ height: 26, padding: "0 10px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#2563eb" }}
          >
            <Upload style={{ width: 11, height: 11 }} />
            Upload New
          </button>
        </div>
      </div>

      <div style={{ padding: "16px 20px", maxWidth: 1400 }}>

        {/* ── KPI strip ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <KpiCard label="T12 Revenue"    value={fmtFull(sm.egr_t12)}       sub="Effective Gross Revenue"   color="#111827" />
          <KpiCard label="T12 Expenses"   value={fmtFull(sm.total_exp_t12)} sub="Total Operating Expenses"  color="#dc2626" />
          <KpiCard label="T12 NOI"        value={fmtFull(sm.noi_t12)}       sub="Net Operating Income"      color={sm.noi_t12 >= 0 ? "#059669" : "#dc2626"} />
          <KpiCard
            label="Expense Ratio"
            value={sm.egr_t12 > 0 ? fmtPct((sm.total_exp_t12 / sm.egr_t12) * 100) : "—"}
            sub="Operating expenses / revenue"
            color="#7c3aed"
          />
        </div>

        {/* ── 2x2 chart grid ────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Chart 1: Gross Potential Rent (Bar) */}
          <Card title="Gross Potential Rent">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={md} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<BarTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="base_rental"  name="Base Rental Revenue" fill="#3b82f6" radius={[2,2,0,0]} />
                <Bar dataKey="other_income" name="Other Income"         fill="#93c5fd" radius={[2,2,0,0]} stackId="rev" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Chart 2: Historical Operating Performance (table) */}
          <Card title="Historical Operating Performance">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ textAlign: "left",  padding: "4px 6px", fontSize: 11, fontWeight: 600, color: "#6b7280" }}></th>
                  {["T12","T3","T1"].map(t => (
                    <th key={t} style={{ textAlign: "right", padding: "4px 8px", fontSize: 11, fontWeight: 600, color: "#374151", minWidth: 80 }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics.historical_perf.map((row, i) => (
                  <tr key={i} style={{ borderBottom: row.bold ? "1px solid #e5e7eb" : "1px solid #f9fafb" }}>
                    <td style={{
                      padding: "5px 6px",
                      fontSize: 11,
                      fontWeight: row.bold ? 600 : 400,
                      fontStyle: row.italic ? "italic" : "normal",
                      color: row.bold ? "#111827" : "#374151",
                      paddingTop: row.bold ? 7 : 5,
                    }}>
                      {row.description}
                    </td>
                    {(["t12","t3","t1"] as const).map(k => (
                      <td key={k} style={{
                        padding: "5px 8px",
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontSize: 11,
                        fontWeight: row.bold ? 700 : 400,
                        color: row.is_ratio
                          ? "#6b7280"
                          : row.description === "Net Operating Income"
                          ? (row[k] >= 0 ? "#059669" : "#dc2626")
                          : row.bold
                          ? "#111827"
                          : "#374151",
                      }}>
                        {row.is_ratio ? fmtPct(row[k]) : fmtFull(row[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 8 }}>
              Operating expenses in all columns show T12 amounts.
            </p>
          </Card>

          {/* Chart 3: NOI Trend (Line chart) */}
          <Card title="NOI Trend — Revenue vs Expenses">
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              {noiTrend
                ? <TrendingUp  style={{ width: 14, height: 14, color: "#059669" }} />
                : <TrendingDown style={{ width: 14, height: 14, color: "#dc2626" }} />
              }
              <span style={{ fontSize: 11, color: noiTrend ? "#059669" : "#dc2626", fontWeight: 600 }}>
                T12 NOI: {fmtFull(sm.noi_t12)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={md} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<LineTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke="#e5e7eb" />
                <Line
                  type="monotone" dataKey="total_revenue" name="Total Revenue"
                  stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone" dataKey="total_expense" name="Total Expenses"
                  stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: "#f97316" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone" dataKey="noi" name="NOI"
                  stroke="#059669" strokeWidth={2.5} strokeDasharray="5 3"
                  dot={{ r: 3, fill: "#059669" }} activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Chart 4: Operating Expenses Breakdown (Donut) */}
          <Card title="Operating Expenses Breakdown">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Donut */}
              <div style={{ flex: "0 0 180px", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.expense_breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={PieLabel}
                      onMouseEnter={(_, idx) => setActiveExpSlice(idx)}
                      onMouseLeave={() => setActiveExpSlice(null)}
                    >
                      {analytics.expense_breakdown.map((slice, i) => (
                        <Cell
                          key={i}
                          fill={slice.color}
                          opacity={activeExpSlice === null || activeExpSlice === i ? 1 : 0.5}
                          stroke={activeExpSlice === i ? "#fff" : "none"}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend + values */}
              <div style={{ flex: 1, fontSize: 11 }}>
                {analytics.expense_breakdown.map((slice, i) => {
                  const total  = analytics.expense_breakdown.reduce((s, e) => s + e.value, 0);
                  const pct    = total > 0 ? ((slice.value / total) * 100).toFixed(1) : "0";
                  const isHov  = activeExpSlice === i;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setActiveExpSlice(i)}
                      onMouseLeave={() => setActiveExpSlice(null)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "4px 6px", borderRadius: 4, cursor: "default",
                        background: isHov ? "#f9fafb" : "transparent",
                        marginBottom: 2,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: slice.color, flexShrink: 0 }} />
                        <span style={{ color: "#374151", fontWeight: isHov ? 600 : 400 }}>{slice.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#6b7280", fontSize: 10 }}>{pct}%</span>
                        <span style={{ fontFamily: "monospace", color: "#111827", fontWeight: isHov ? 600 : 400, minWidth: 70, textAlign: "right" }}>
                          {fmtFull(slice.value)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {/* Total */}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 6px 2px", borderTop: "1px solid #e5e7eb", marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>Total Expenses</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#dc2626" }}>
                    {fmtFull(analytics.expense_breakdown.reduce((s, e) => s + e.value, 0))}
                  </span>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
