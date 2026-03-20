import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Loader2, Download, FileSpreadsheet, Pencil, X } from "lucide-react";
import { osDataApi, osMappingApi } from "@/services/operatingStatementApi";
import type { OsBatchData, OsLineItemRow, ChartOfAccountItem } from "@/services/operatingStatementApi";
import { SpecifyExpensesModal } from "./SpecifyExpensesModal";
import { toast } from "sonner";

interface Props {
  dealId: string;
  batchId: string;
  onSave: () => void;
  onCancel: () => void;
}

// ── Column search state ───────────────────────────────────────────────────────
interface ColFilter { description: string; account: string; }

export function OsEditableGrid({ dealId, batchId, onSave, onCancel }: Props) {
  const [data, setData]                       = useState<OsBatchData | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editedRows, setEditedRows]           = useState<Set<string>>(new Set());
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccountItem[]>([]);
  const [showMappingPanel, setShowMappingPanel] = useState(true);
  const [colFilter, setColFilter]             = useState<ColFilter>({ description: "", account: "" });
  const [view, setView]                       = useState<"actuals" | "proforma">("actuals");
  const [highlightUnmapped, setHighlightUnmapped] = useState(false);
  const [hoveredRow, setHoveredRow]           = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [batchData, accounts] = await Promise.all([
          osDataApi.getBatchData(dealId, batchId === "latest" ? undefined : batchId),
          osMappingApi.getChartOfAccounts().catch(() => []),
        ]);
        setData(batchData);
        setChartOfAccounts(accounts);
      } catch (err: any) {
        toast.error(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dealId, batchId]);

  const handleCellEdit = useCallback((rowId: string, colKey: string, value: number) => {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, rows: prev.rows.map(r => r.id !== rowId ? r : { ...r, values: { ...r.values, [colKey]: value } }) };
    });
    setEditedRows(prev => new Set(prev).add(rowId));
  }, []);

  const handleMappingChange = useCallback((rowId: string, accountId: number | null, account?: ChartOfAccountItem) => {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map(r => r.id !== rowId ? r : {
          ...r,
          mapping_account_id: accountId,
          mapping_account_name: account?.account_name || "",
          mapping_code: account?.code || "",
          is_expense: account?.is_expense ?? r.is_expense,
        }),
      };
    });
    setEditedRows(prev => new Set(prev).add(rowId));
  }, []);

  // Filtered rows
  const visibleRows = useMemo(() => {
    if (!data) return [];
    const df = colFilter.description.toLowerCase();
    const af = colFilter.account.toLowerCase();
    if (!df && !af) return data.rows;
    return data.rows.filter(r => {
      if (df && !r.description.toLowerCase().includes(df)) return false;
      if (af && !(r.mapping_account_name || "").toLowerCase().includes(af)) return false;
      return true;
    });
  }, [data, colFilter]);

  // Live NOI
  const summary = useMemo(() => {
    if (!data) return null;
    const cols = data.columns;
    const income:  Record<string, number> = {};
    const expense: Record<string, number> = {};
    const noi:     Record<string, number> = {};
    cols.forEach(c => { income[c] = 0; expense[c] = 0; noi[c] = 0; });
    data.rows.forEach(r => {
      if (r.is_section_header || r.is_subtotal || r.is_noi_row || r.is_ni_row) return;
      cols.forEach(c => {
        const v = r.values[c] || 0;
        if (r.is_expense) expense[c] += Math.abs(v);
        else income[c] += v;
      });
    });
    cols.forEach(c => { noi[c] = income[c] - expense[c]; });
    return { income, expense, noi };
  }, [data]);

  const mappingStats = useMemo(() => {
    if (!data) return { mapped: 0, unmapped: 0, total: 0 };
    const items = data.rows.filter(r => !r.is_section_header && !r.is_subtotal);
    const mapped = items.filter(r => r.mapping_account_id !== null).length;
    return { mapped, unmapped: items.length - mapped, total: items.length };
  }, [data]);

  const handleSubmit = () => setShowExpenseModal(true);

  const handleExpenseConfirm = async (firstExpenseRow: string | null, noiRow: string | null, niRow: string | null) => {
    setShowExpenseModal(false);
    if (!data) return;
    setSaving(true);
    try {
      await osDataApi.saveAll(dealId, data.batch_id, {
        rows: data.rows.map(r => ({ id: r.id, mapping_account_id: r.mapping_account_id, values: r.values })),
        first_expense_row: firstExpenseRow || undefined,
        noi_row: noiRow || undefined,
        ni_row: niRow || undefined,
      });
      await osDataApi.lockBatch(dealId, data.batch_id);
      toast.success("Operating statement saved");
      onSave();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Number formatting ─────────────────────────────────────────────────────
  const fmt = (v: number | undefined | null): string => {
    if (v === undefined || v === null || v === 0) return "–";
    const abs = Math.abs(v);
    const s   = abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return v < 0 ? `($ ${s})` : `$ ${s}`;
  };

  // ── Loading / empty ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    </div>
  );
  if (!data || data.rows.length === 0) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">No operating statement data available.</p>
    </div>
  );

  // ── Column widths ─────────────────────────────────────────────────────────
  const COD_W  = 52;   // code
  const ACC_W  = 148;  // account mapping
  const LI_W   = 210;  // line item
  const VAL_W  = 96;   // each month column
  const tableMinW = COD_W + ACC_W + LI_W + data.columns.length * VAL_W;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">

      {/* ── Top action bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b px-4 py-1.5 flex-shrink-0 bg-white gap-4">
        {/* Left: mapping stats */}
        <div className="flex items-center gap-4 text-[12px]">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">View:</span>
            <select value={view} onChange={e => setView(e.target.value as any)}
              className="h-6 px-1.5 border rounded text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="actuals">Actuals</option>
              <option value="proforma">Proforma</option>
            </select>
          </div>

          <button
            onClick={() => setHighlightUnmapped(v => !v)}
            className={`h-6 px-2.5 border rounded text-[11px] flex items-center gap-1 transition-colors ${
              highlightUnmapped ? "bg-amber-50 border-amber-300 text-amber-800" : "hover:bg-muted/30"
            }`}
          >
            Highlight Unmapped
          </button>

          {mappingStats.unmapped > 0 && (
            <span className="text-[11px] text-amber-700 font-medium">
              {mappingStats.unmapped} unmapped rows
            </span>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowMappingPanel(v => !v)}
            className="h-7 px-3 border rounded text-[12px] hover:bg-muted/20 transition-colors flex items-center gap-1.5"
          >
            <Pencil className="h-3 w-3" />
            Mappings
          </button>
          <button className="h-7 px-3 border rounded text-[12px] hover:bg-muted/20 transition-colors flex items-center gap-1.5">
            <Download className="h-3 w-3" />
            Export to Excel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="h-7 px-4 rounded text-[12px] font-medium text-white bg-[hsl(200,70%,45%)] hover:bg-[hsl(200,70%,38%)] disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving…" : "Submit"}
          </button>
          <button
            onClick={onCancel}
            className="h-7 px-3 border rounded text-[12px] hover:bg-muted/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* ── Selected row count strip ─────────────────────────────────── */}
      <div className="flex items-center justify-between border-b px-4 py-1 flex-shrink-0 bg-[#f8f9fa]">
        <span className="text-[11px] text-muted-foreground">
          {editedRows.size > 0
            ? `${editedRows.size} row${editedRows.size !== 1 ? "s" : ""} edited`
            : `${data.rows.filter(r => !r.is_section_header && !r.is_subtotal).length} line items`
          }
        </span>
        <div className="flex items-center gap-3">
          {mappingStats.mapped > 0 && (
            <button className="text-[11px] text-primary hover:underline">
              » {mappingStats.mapped} Mappings Applied
            </button>
          )}
          {mappingStats.unmapped > 0 && (
            <button
              onClick={() => setHighlightUnmapped(true)}
              className="text-[11px] text-amber-700 hover:underline"
            >
              » {mappingStats.unmapped} Not Matched
            </button>
          )}
        </div>
      </div>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Table */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-auto">
            <table
              className="border-collapse"
              style={{ minWidth: tableMinW, tableLayout: "fixed", width: "100%" }}
            >
              <colgroup>
                <col style={{ width: COD_W, minWidth: COD_W }} />
                <col style={{ width: ACC_W, minWidth: ACC_W }} />
                <col style={{ width: LI_W,  minWidth: LI_W  }} />
                {data.columns.map(c => (
                  <col key={c} style={{ width: VAL_W, minWidth: VAL_W }} />
                ))}
              </colgroup>

              <thead className="sticky top-0 z-20">
                {/* ── Row 1: frequency dropdowns + month labels ──── */}
                <tr style={{ background: "#f4f5f7", borderBottom: "1px solid #dde1e7" }}>
                  <th style={{ ...TH, width: COD_W, borderRight: "1px solid #dde1e7" }} />
                  <th style={{ ...TH, width: ACC_W, borderRight: "1px solid #dde1e7", textAlign: "left" }}>
                    Account
                  </th>
                  <th style={{ ...TH, width: LI_W, borderRight: "1px solid #dde1e7", textAlign: "left" }}>
                    Line Item
                  </th>
                  {data.columns.map((col, i) => (
                    <th key={col} style={{ ...TH, width: VAL_W, borderRight: "1px solid #dde1e7", textAlign: "center" }}>
                      <select style={{ fontSize: 11, background: "transparent", border: "none", width: "100%", textAlign: "center", cursor: "pointer", color: "#6b7280", outline: "none" }}>
                        <option>Monthly</option>
                        <option>Annual</option>
                      </select>
                    </th>
                  ))}
                </tr>

                {/* ── Row 2: month labels ────────────────────────── */}
                <tr style={{ background: "#f9fafb", borderBottom: "2px solid #dde1e7" }}>
                  <th style={{ ...TH, width: COD_W, borderRight: "1px solid #dde1e7", color: "#6b7280", fontSize: 10 }}>
                    Code
                  </th>
                  <th style={{ ...TH, width: ACC_W, borderRight: "1px solid #dde1e7", textAlign: "left", color: "#374151" }} />
                  <th style={{ ...TH, width: LI_W, borderRight: "1px solid #dde1e7", textAlign: "left", color: "#374151" }} />
                  {data.column_labels.map((label, i) => (
                    <th key={i} style={{ ...TH, width: VAL_W, borderRight: "1px solid #dde1e7", textAlign: "right", color: "#374151", fontWeight: 600 }}>
                      {label}
                    </th>
                  ))}
                </tr>

                {/* ── Row 3: column search filters ──────────────── */}
                <tr style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ ...TD, width: COD_W, borderRight: "1px solid #e5e7eb" }} />
                  <td style={{ padding: "3px 6px", width: ACC_W, borderRight: "1px solid #e5e7eb" }}>
                    <input
                      placeholder=""
                      value={colFilter.account}
                      onChange={e => setColFilter(p => ({ ...p, account: e.target.value }))}
                      style={FILTER_INPUT}
                    />
                  </td>
                  <td style={{ padding: "3px 6px", width: LI_W, borderRight: "1px solid #e5e7eb" }}>
                    <input
                      placeholder=""
                      value={colFilter.description}
                      onChange={e => setColFilter(p => ({ ...p, description: e.target.value }))}
                      style={FILTER_INPUT}
                    />
                  </td>
                  {data.columns.map(c => (
                    <td key={c} style={{ ...TD, width: VAL_W, borderRight: "1px solid #e5e7eb" }} />
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((row) => {
                  const isEdited    = editedRows.has(row.id);
                  const isHovered   = hoveredRow === row.id;
                  const isHeader    = row.is_section_header;
                  const isSubtotal  = row.is_subtotal;
                  const isSpecial   = row.is_noi_row || row.is_ni_row;
                  const isUnmapped  = highlightUnmapped && !row.mapping_account_id && !isHeader && !isSubtotal;

                  // Row background
                  let rowBg = "#fff";
                  if (isHeader)   rowBg = "#f4f5f7";
                  else if (isSubtotal) rowBg = "#f9fafb";
                  else if (isSpecial)  rowBg = "#ebf5ff";
                  else if (isEdited)   rowBg = "#fffbeb";
                  else if (isUnmapped) rowBg = "#fffbeb";
                  if (isHovered && !isHeader) rowBg = "#e8f0fe";

                  return (
                    <tr
                      key={row.id}
                      onMouseEnter={() => setHoveredRow(row.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        background: rowBg,
                        borderBottom: "1px solid #e5e7eb",
                        height: isHeader ? 28 : 26,
                        transition: "background 80ms",
                      }}
                    >
                      {/* Code */}
                      <td style={{ ...TD, width: COD_W, borderRight: "1px solid #e5e7eb", textAlign: "center", fontFamily: "monospace", fontSize: 10, color: "#9ca3af" }}>
                        {!isHeader && row.mapping_code}
                      </td>

                      {/* Account */}
                      <td style={{ ...TD, width: ACC_W, borderRight: "1px solid #e5e7eb", overflow: "hidden" }}>
                        {!isHeader && !isSubtotal && !isSpecial ? (
                          <MappingDropdown
                            value={row.mapping_account_id}
                            accounts={chartOfAccounts}
                            displayValue={row.mapping_account_name || ""}
                            isLowConf={(row.mapping_score ?? 100) < 80}
                            onChange={(id, acc) => handleMappingChange(row.id, id, acc)}
                          />
                        ) : (
                          <span style={{ fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                            {row.mapping_account_name || ""}
                          </span>
                        )}
                      </td>

                      {/* Line Item */}
                      <td style={{
                        ...TD, width: LI_W, borderRight: "1px solid #e5e7eb",
                        fontWeight: isHeader || isSpecial ? 600 : isSubtotal ? 500 : 400,
                        paddingLeft: isHeader ? 8 : isSubtotal ? 8 : 8,
                        fontSize: isHeader ? 12 : 12,
                        color: isSpecial ? "#1d4ed8" : isHeader ? "#111827" : "#374151",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {row.description}
                      </td>

                      {/* Monthly values */}
                      {data.columns.map(col => {
                        const val = row.values[col];
                        if (isHeader) return (
                          <td key={col} style={{ ...TD, width: VAL_W, borderRight: "1px solid #e5e7eb" }} />
                        );
                        if (isSubtotal || isSpecial) return (
                          <td key={col} style={{
                            ...TD, width: VAL_W, borderRight: "1px solid #e5e7eb",
                            textAlign: "right", fontWeight: 600, fontSize: 12,
                            color: (val ?? 0) < 0 ? "#dc2626" : isSpecial ? "#1d4ed8" : "#111827",
                          }}>
                            {fmt(val)}
                          </td>
                        );
                        return (
                          <td key={col} style={{ padding: 0, width: VAL_W, borderRight: "1px solid #e5e7eb" }}>
                            <EditableCell
                              value={val}
                              readOnly={data.is_locked}
                              onChange={v => handleCellEdit(row.id, col, v)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ── NOI footer ──────────────────────────────────── */}
            {summary && (
              <div style={{
                position: "sticky", bottom: 0, zIndex: 20,
                borderTop: "2px solid #94a3b8",
                boxShadow: "0 -2px 8px rgba(0,0,0,0.07)",
                background: "#fff",
              }}>
                <table className="border-collapse" style={{ minWidth: tableMinW, tableLayout: "fixed", width: "100%" }}>
                  <colgroup>
                    <col style={{ width: COD_W }} />
                    <col style={{ width: ACC_W }} />
                    <col style={{ width: LI_W  }} />
                    {data.columns.map(c => <col key={c} style={{ width: VAL_W }} />)}
                  </colgroup>
                  <tbody>
                    <FooterRow label="Total Income"   values={summary.income}  columns={data.columns} COD_W={COD_W} ACC_W={ACC_W} LI_W={LI_W} VAL_W={VAL_W} color="#059669" />
                    <FooterRow label="Total Expense"  values={summary.expense} columns={data.columns} COD_W={COD_W} ACC_W={ACC_W} LI_W={LI_W} VAL_W={VAL_W} color="#dc2626" />
                    <FooterRow label="NOI"            values={summary.noi}     columns={data.columns} COD_W={COD_W} ACC_W={ACC_W} LI_W={LI_W} VAL_W={VAL_W} color="#1d4ed8" bold bg="#eff6ff" />
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Right mapping panel ──────────────────────────────────── */}
        {showMappingPanel && (
          <div style={{ width: 200, flexShrink: 0, borderLeft: "1px solid #e5e7eb", background: "#fafafa", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>Info</span>
              <button onClick={() => setShowMappingPanel(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 2 }}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div style={{ padding: "10px 12px", fontSize: 11, lineHeight: 1.6 }}>
              <p style={{ color: "#6b7280", marginBottom: 8 }}>Click below to toggle highlighting.</p>

              <button
                onClick={() => setHighlightUnmapped(false)}
                style={{ display: "block", color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "2px 0", width: "100%", textAlign: "left" }}
              >
                » {mappingStats.mapped} Mappings Applied
              </button>

              <button
                onClick={() => setHighlightUnmapped(true)}
                style={{ display: "block", color: mappingStats.unmapped > 0 ? "#dc2626" : "#6b7280", background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "2px 0", width: "100%", textAlign: "left" }}
              >
                » {mappingStats.unmapped} Mappings Not Matched
              </button>

              {highlightUnmapped && (
                <button
                  onClick={() => setHighlightUnmapped(false)}
                  style={{ display: "block", color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "6px 0 2px", width: "100%", textAlign: "left" }}
                >
                  ✕ Remove Highlights
                </button>
              )}

              <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 10 }}>
                <p style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 6 }}>
                  Progress
                </p>
                <div style={{ background: "#e5e7eb", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{
                    background: mappingStats.unmapped === 0 ? "#059669" : "#2563eb",
                    height: "100%",
                    width: `${mappingStats.total > 0 ? (mappingStats.mapped / mappingStats.total) * 100 : 0}%`,
                    borderRadius: 4,
                    transition: "width 0.3s",
                  }} />
                </div>
                <p style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>
                  {mappingStats.mapped} / {mappingStats.total} mapped
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showExpenseModal && (
        <SpecifyExpensesModal
          rows={data.rows}
          onConfirm={handleExpenseConfirm}
          onCancel={() => setShowExpenseModal(false)}
        />
      )}
    </div>
  );
}

// ── Style constants ───────────────────────────────────────────────────────────
const TH: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  color: "#6b7280",
  whiteSpace: "nowrap",
  borderBottom: "1px solid #dde1e7",
};

const TD: React.CSSProperties = {
  padding: "3px 8px",
  fontSize: 12,
  color: "#374151",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const FILTER_INPUT: React.CSSProperties = {
  width: "100%",
  height: 22,
  border: "1px solid #d1d5db",
  borderRadius: 3,
  padding: "0 6px",
  fontSize: 11,
  background: "#fff",
  outline: "none",
  color: "#374151",
};

// ── FooterRow ─────────────────────────────────────────────────────────────────
function FooterRow({ label, values, columns, COD_W, ACC_W, LI_W, VAL_W, color, bold = false, bg = "#fff" }: {
  label: string; values: Record<string, number>; columns: string[];
  COD_W: number; ACC_W: number; LI_W: number; VAL_W: number;
  color?: string; bold?: boolean; bg?: string;
}) {
  const fmt = (v: number) => {
    const abs = Math.abs(v);
    const s = abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return v < 0 ? `($ ${s})` : v === 0 ? "–" : `$ ${s}`;
  };
  return (
    <tr style={{ background: bg, borderBottom: "1px solid #e5e7eb", height: 28 }}>
      <td style={{ ...TD, width: COD_W, borderRight: "1px solid #e5e7eb" }} />
      <td style={{ ...TD, width: ACC_W, borderRight: "1px solid #e5e7eb" }} />
      <td style={{ ...TD, width: LI_W,  borderRight: "1px solid #e5e7eb", fontWeight: bold ? 700 : 600, color: color || "#111827" }}>
        {label}
      </td>
      {columns.map(col => {
        const v = values[col] || 0;
        return (
          <td key={col} style={{ ...TD, width: VAL_W, borderRight: "1px solid #e5e7eb", textAlign: "right", fontWeight: bold ? 700 : 600, color: v < 0 ? "#dc2626" : (color || "#111827") }}>
            {fmt(v)}
          </td>
        );
      })}
    </tr>
  );
}

// ── EditableCell ──────────────────────────────────────────────────────────────
function EditableCell({ value, onChange, readOnly }: {
  value: number | undefined; onChange: (v: number) => void; readOnly?: boolean;
}) {
  const [editing,  setEditing]  = useState(false);
  const [localVal, setLocalVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const display = useMemo(() => {
    if (value === undefined || value === null || value === 0) return "–";
    const abs = Math.abs(value);
    const s = abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return value < 0 ? `($ ${s})` : `$ ${s}`;
  }, [value]);

  const startEdit = () => {
    if (readOnly) return;
    setLocalVal(value?.toString() || "");
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    setEditing(false);
    const num = parseFloat(localVal.replace(/[$,\s()]/g, ""));
    if (!isNaN(num)) onChange(localVal.includes("(") ? -Math.abs(num) : num);
  };

  if (editing) return (
    <input ref={inputRef} value={localVal}
      onChange={e => setLocalVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter" || e.key === "Tab") commit(); if (e.key === "Escape") setEditing(false); }}
      style={{ width: "100%", height: 24, padding: "0 8px", textAlign: "right", fontSize: 12, border: "1px solid #2563eb", borderRadius: 2, outline: "none", background: "#fff" }}
      autoFocus
    />
  );

  return (
    <div
      onClick={startEdit}
      style={{
        padding: "3px 8px", textAlign: "right", fontSize: 12,
        cursor: readOnly ? "default" : "text",
        minHeight: 24, lineHeight: "18px",
        color: (value ?? 0) < 0 ? "#dc2626" : "#374151",
        userSelect: "none",
      }}
      className={!readOnly ? "hover:bg-blue-50 transition-colors" : ""}
    >
      {display}
    </div>
  );
}

// ── MappingDropdown ───────────────────────────────────────────────────────────
function MappingDropdown({ value, accounts, displayValue, isLowConf, onChange }: {
  value: number | null; accounts: ChartOfAccountItem[];
  displayValue: string; isLowConf?: boolean;
  onChange: (id: number | null, account?: ChartOfAccountItem) => void;
}) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const filtered = useMemo(() =>
    accounts.filter(a =>
      a.account_name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
    ), [accounts, search]);

  const incomeList  = filtered.filter(a => !a.is_expense);
  const expenseList = filtered.filter(a =>  a.is_expense);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button
        onClick={() => setOpen(v => !v)}
        title={displayValue || "Select an Option"}
        style={{
          display: "block", width: "100%", textAlign: "left",
          background: "none", border: "none", cursor: "pointer",
          fontSize: 11, padding: "1px 0",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: !displayValue ? "#9ca3af" : isLowConf ? "#92400e" : "#374151",
          fontStyle: !displayValue ? "italic" : "normal",
        }}
      >
        {displayValue || "Select an Option"}
      </button>

      {open && (
        <div style={{
          position: "absolute", left: 0, top: "100%", zIndex: 100,
          background: "#fff", border: "1px solid #d1d5db",
          borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          width: 240, maxHeight: 300, display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "6px 8px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
            <input
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{ width: "100%", height: 24, border: "1px solid #d1d5db", borderRadius: 3, padding: "0 8px", fontSize: 11, outline: "none" }}
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {incomeList.length > 0 && <>
              <div style={{ padding: "4px 10px 2px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", background: "#f9fafb", position: "sticky", top: 0 }}>
                Income
              </div>
              {incomeList.map(a => (
                <button key={a.id}
                  onClick={() => { onChange(a.id, a); setOpen(false); setSearch(""); }}
                  style={{
                    display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                    padding: "5px 10px", fontSize: 11, background: a.id === value ? "#eff6ff" : "none",
                    border: "none", cursor: "pointer", textAlign: "left", fontWeight: a.id === value ? 600 : 400,
                    color: "#374151",
                  }}
                  className="hover:bg-slate-50"
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.account_name}</span>
                  <span style={{ marginLeft: 8, fontSize: 10, color: "#9ca3af", fontFamily: "monospace", flexShrink: 0 }}>[{a.code}]</span>
                </button>
              ))}
            </>}
            {expenseList.length > 0 && <>
              <div style={{ padding: "4px 10px 2px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", background: "#f9fafb", position: "sticky", top: 0 }}>
                Expense
              </div>
              {expenseList.map(a => (
                <button key={a.id}
                  onClick={() => { onChange(a.id, a); setOpen(false); setSearch(""); }}
                  style={{
                    display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                    padding: "5px 10px", fontSize: 11, background: a.id === value ? "#eff6ff" : "none",
                    border: "none", cursor: "pointer", textAlign: "left", fontWeight: a.id === value ? 600 : 400,
                    color: "#374151",
                  }}
                  className="hover:bg-slate-50"
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.account_name}</span>
                  <span style={{ marginLeft: 8, fontSize: 10, color: "#9ca3af", fontFamily: "monospace", flexShrink: 0 }}>[{a.code}]</span>
                </button>
              ))}
            </>}
            {filtered.length === 0 && (
              <p style={{ textAlign: "center", padding: 12, fontSize: 11, color: "#9ca3af" }}>No results</p>
            )}
          </div>
          {value !== null && (
            <div style={{ borderTop: "1px solid #e5e7eb", flexShrink: 0 }}>
              <button
                onClick={() => { onChange(null); setOpen(false); }}
                style={{ width: "100%", textAlign: "left", padding: "6px 10px", fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}
                className="hover:bg-slate-50"
              >
                Clear mapping
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
