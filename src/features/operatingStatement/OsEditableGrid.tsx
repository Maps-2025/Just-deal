import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2, Download, Pencil, X } from "lucide-react";
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

interface ColFilter { description: string; account: string; }

// Tracks per-cell adjustments (orig value + user adjustment + notes)
interface CellAdjustment {
  origVal:    number;
  adjustment: number;
  notes:      string;
}

// Popup state: which cell is being adjusted
interface AdjustTarget {
  rowId:    string;
  colKey:   string;
  colLabel: string;
  rowLabel: string;
}

export function OsEditableGrid({ dealId, batchId, onSave, onCancel }: Props) {
  const [data,              setData]              = useState<OsBatchData | null>(null);
  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [showExpenseModal,  setShowExpenseModal]  = useState(false);
  const [editedRows,        setEditedRows]        = useState<Set<string>>(new Set());
  const [chartOfAccounts,   setChartOfAccounts]   = useState<ChartOfAccountItem[]>([]);
  const [showMappingPanel,  setShowMappingPanel]  = useState(true);
  const [colFilter,         setColFilter]         = useState<ColFilter>({ description: "", account: "" });
  const [view,              setView]              = useState<"actuals" | "proforma">("actuals");
  const [highlightUnmapped, setHighlightUnmapped] = useState(false);
  const [hoveredRow,        setHoveredRow]        = useState<string | null>(null);
  // Adjust/Edit popup state
  const [adjustTarget,      setAdjustTarget]      = useState<AdjustTarget | null>(null);
  // Per-cell adjustments keyed by "rowId__colKey"
  const [adjustments,       setAdjustments]       = useState<Record<string, CellAdjustment>>({});

  // Original values snapshot (set once on load, never mutated)
  const originalRowsRef = useRef<OsLineItemRow[]>([]);
  // Row element refs for scroll-to-unmapped
  const rowRefs         = useRef<Record<string, HTMLTableRowElement | null>>({});
  const scrollRef       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [batchData, accounts] = await Promise.all([
          osDataApi.getBatchData(dealId, batchId === "latest" ? undefined : batchId),
          osMappingApi.getChartOfAccounts().catch(() => []),
        ]);
        setData(batchData);
        // Snapshot original values so we can compute variance later
        originalRowsRef.current = JSON.parse(JSON.stringify(batchData.rows));
        setChartOfAccounts(accounts);
      } catch (err: any) {
        toast.error(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dealId, batchId]);

  // ── Cell value update (called after user saves an adjustment) ─────────────
  const handleCellEdit = useCallback((rowId: string, colKey: string, value: number) => {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map(r =>
          r.id !== rowId ? r : { ...r, values: { ...r.values, [colKey]: value } }
        ),
      };
    });
    setEditedRows(prev => new Set(prev).add(rowId));
  }, []);

  // ── Open the Adjust/Edit popup ────────────────────────────────────────────
  const openAdjust = useCallback((rowId: string, colKey: string, rowLabel: string, colLabel: string) => {
    if (!data || data.is_locked) return;
    setAdjustTarget({ rowId, colKey, colLabel, rowLabel });
  }, [data]);

  // ── Save adjustment from popup ────────────────────────────────────────────
  const handleAdjustSave = useCallback((
    rowId:      string,
    colKey:     string,
    origVal:    number,
    adjustment: number,
    notes:      string,
  ) => {
    const key = `${rowId}__${colKey}`;
    setAdjustments(prev => ({ ...prev, [key]: { origVal, adjustment, notes } }));
    handleCellEdit(rowId, colKey, origVal + adjustment);
    setAdjustTarget(null);
  }, [handleCellEdit]);

  // ── Mapping change ────────────────────────────────────────────────────────
  const handleMappingChange = useCallback((rowId: string, accountId: number | null, account?: ChartOfAccountItem) => {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map(r =>
          r.id !== rowId ? r : {
            ...r,
            mapping_account_id:   accountId,
            mapping_account_name: account?.account_name || "",
            mapping_code:         account?.code || "",
            is_expense:           account?.is_expense ?? r.is_expense,
          }
        ),
      };
    });
    setEditedRows(prev => new Set(prev).add(rowId));
  }, []);

  // ── Scroll to first unmapped row ──────────────────────────────────────────
  const scrollToFirstUnmapped = useCallback(() => {
    setHighlightUnmapped(true);
    const firstUnmapped = data?.rows.find(
      r => !r.mapping_account_id && !r.is_section_header && !r.is_subtotal
    );
    if (firstUnmapped) {
      const el = rowRefs.current[firstUnmapped.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data]);

  // ── Filtered rows ─────────────────────────────────────────────────────────
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

  // ── Live summary (calculated from current/adjusted values) ───────────────
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

  // ── Original NOI from snapshot (before any adjustments) ──────────────────
  const originalNoi = useMemo(() => {
    if (!data) return null;
    const cols = data.columns;
    const result: Record<string, number> = {};
    cols.forEach(c => { result[c] = 0; });

    // Try to use the noi_row from the original file first
    const noiRows = originalRowsRef.current.filter(r => r.is_noi_row);
    if (noiRows.length > 0) {
      cols.forEach(c => {
        noiRows.forEach(r => { result[c] += r.values[c] || 0; });
      });
      return result;
    }

    // Fallback: recompute from original income - expense
    cols.forEach(c => {
      let inc = 0, exp = 0;
      originalRowsRef.current.forEach(r => {
        if (r.is_section_header || r.is_subtotal || r.is_noi_row || r.is_ni_row) return;
        const v = r.values[c] || 0;
        if (r.is_expense) exp += Math.abs(v);
        else inc += v;
      });
      result[c] = inc - exp;
    });
    return result;
  }, [data]);

  // ── Variance = calculatedNOI - originalNOI ────────────────────────────────
  const noiVariance = useMemo(() => {
    if (!summary || !originalNoi) return null;
    const result: Record<string, number> = {};
    Object.keys(summary.noi).forEach(c => {
      result[c] = (summary.noi[c] || 0) - (originalNoi[c] || 0);
    });
    return result;
  }, [summary, originalNoi]);

  // ── Net Income (NOI minus below-the-line items) ───────────────────────────
  const netIncomeSummary = useMemo(() => {
    if (!data || !summary) return null;
    const cols = data.columns;
    const belowLineCodes = ["capex", "int", "prin", "dep"];
    const calc: Record<string, number> = {};
    const orig: Record<string, number> = {};
    const variance: Record<string, number> = {};

    cols.forEach(c => {
      let belowCalc = 0, belowOrig = 0;
      data.rows.forEach(r => {
        if (belowLineCodes.includes(r.mapping_code || "")) belowCalc += Math.abs(r.values[c] || 0);
      });
      originalRowsRef.current.forEach(r => {
        if (belowLineCodes.includes(r.mapping_code || "")) belowOrig += Math.abs(r.values[c] || 0);
      });
      calc[c]     = summary.noi[c] - belowCalc;
      orig[c]     = (originalNoi?.[c] || 0) - belowOrig;
      variance[c] = calc[c] - orig[c];
    });
    return { calc, orig, variance };
  }, [data, summary, originalNoi]);

  // ── Mapping stats ─────────────────────────────────────────────────────────
  const mappingStats = useMemo(() => {
    if (!data) return { mapped: 0, unmapped: 0, total: 0 };
    const items = data.rows.filter(r => !r.is_section_header && !r.is_subtotal);
    const mapped = items.filter(r => r.mapping_account_id !== null).length;
    return { mapped, unmapped: items.length - mapped, total: items.length };
  }, [data]);

  const handleSubmit = () => setShowExpenseModal(true);

  const handleExpenseConfirm = async (
    firstExpenseRow: string | null,
    noiRow:          string | null,
    niRow:           string | null,
  ) => {
    setShowExpenseModal(false);
    if (!data) return;
    setSaving(true);
    try {
      await osDataApi.saveAll(dealId, data.batch_id, {
        rows: data.rows.map(r => ({
          id:                 r.id,
          mapping_account_id: r.mapping_account_id,
          values:             r.values,
        })),
        first_expense_row: firstExpenseRow || undefined,
        noi_row:           noiRow          || undefined,
        ni_row:            niRow           || undefined,
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

  const fmt = (v: number | undefined | null): string => {
    if (v === undefined || v === null || v === 0) return "–";
    const abs = Math.abs(v);
    const s   = abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return v < 0 ? `($ ${s})` : `$ ${s}`;
  };

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

  const COD_W = 52;
  const ACC_W = 148;
  const LI_W  = 210;
  const VAL_W = 96;
  const tableMinW = COD_W + ACC_W + LI_W + data.columns.length * VAL_W;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">

      {/* ── Adjust/Edit Popup ─────────────────────────────────────────── */}
      {adjustTarget && data && (() => {
        const row      = data.rows.find(r => r.id === adjustTarget.rowId);
        const rawOrig  = originalRowsRef.current.find(r => r.id === adjustTarget.rowId)?.values[adjustTarget.colKey] ?? 0;
        const key      = `${adjustTarget.rowId}__${adjustTarget.colKey}`;
        const saved    = adjustments[key];
        return (
          <AdjustEditPopup
            rowLabel  = {adjustTarget.rowLabel}
            colLabel  = {adjustTarget.colLabel}
            origValue = {saved ? saved.origVal : rawOrig}
            savedAdj  = {saved?.adjustment ?? 0}
            savedNotes= {saved?.notes ?? ""}
            onSave    = {(adj, notes) =>
              handleAdjustSave(adjustTarget.rowId, adjustTarget.colKey, saved ? saved.origVal : rawOrig, adj, notes)
            }
            onCancel  = {() => setAdjustTarget(null)}
          />
        );
      })()}

      {/* ── Top action bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b px-4 py-1.5 flex-shrink-0 bg-white gap-4">
        <div className="flex items-center gap-4 text-[12px]">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">View:</span>
            <select
              value={view}
              onChange={e => setView(e.target.value as any)}
              className="h-6 px-1.5 border rounded text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
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

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b px-4 py-1 flex-shrink-0 bg-[#f8f9fa]">
        <span className="text-[11px] text-muted-foreground">
          {editedRows.size > 0
            ? `${editedRows.size} row${editedRows.size !== 1 ? "s" : ""} edited`
            : `${data.rows.filter(r => !r.is_section_header && !r.is_subtotal).length} line items`}
        </span>
        <div className="flex items-center gap-3">
          {mappingStats.mapped > 0 && (
            <button
              onClick={() => setHighlightUnmapped(false)}
              className="text-[11px] text-primary hover:underline"
            >
              » {mappingStats.mapped} Mappings Applied
            </button>
          )}
          {mappingStats.unmapped > 0 && (
            // FIX: clicking "Not Matched" now scrolls to first unmapped row
            <button
              onClick={scrollToFirstUnmapped}
              className="text-[11px] text-amber-700 hover:underline font-medium"
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
                {/* Frequency dropdowns row */}
                <tr style={{ background: "#f4f5f7", borderBottom: "1px solid #dde1e7" }}>
                  <th style={{ ...TH, width: COD_W, borderRight: "1px solid #dde1e7" }} />
                  <th style={{ ...TH, width: ACC_W, borderRight: "1px solid #dde1e7", textAlign: "left" }}>
                    Account
                  </th>
                  <th style={{ ...TH, width: LI_W, borderRight: "1px solid #dde1e7", textAlign: "left" }}>
                    Line Item
                  </th>
                  {data.columns.map(col => (
                    <th key={col} style={{ ...TH, width: VAL_W, borderRight: "1px solid #dde1e7", textAlign: "center" }}>
                      <select style={{ fontSize: 11, background: "transparent", border: "none", width: "100%", textAlign: "center", cursor: "pointer", color: "#6b7280", outline: "none" }}>
                        <option>Monthly</option>
                        <option>Annual</option>
                      </select>
                    </th>
                  ))}
                </tr>

                {/* Month labels row */}
                <tr style={{ background: "#f9fafb", borderBottom: "2px solid #dde1e7" }}>
                  <th style={{ ...TH, width: COD_W, borderRight: "1px solid #dde1e7", color: "#6b7280", fontSize: 10 }}>
                    Code
                  </th>
                  <th style={{ ...TH, width: ACC_W, borderRight: "1px solid #dde1e7" }} />
                  <th style={{ ...TH, width: LI_W,  borderRight: "1px solid #dde1e7" }} />
                  {data.column_labels.map((label, i) => (
                    <th key={i} style={{ ...TH, width: VAL_W, borderRight: "1px solid #dde1e7", textAlign: "right", color: "#374151", fontWeight: 600 }}>
                      {label}
                    </th>
                  ))}
                </tr>

                {/* Search filter row */}
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
                {visibleRows.map(row => {
                  const isEdited   = editedRows.has(row.id);
                  const isHovered  = hoveredRow === row.id;
                  const isHeader   = row.is_section_header;
                  const isSubtotal = row.is_subtotal;
                  const isSpecial  = row.is_noi_row || row.is_ni_row;
                  const isUnmapped = highlightUnmapped && !row.mapping_account_id && !isHeader && !isSubtotal;

                  let rowBg = "#fff";
                  if (isHeader)        rowBg = "#f4f5f7";
                  else if (isSubtotal) rowBg = "#f9fafb";
                  else if (isSpecial)  rowBg = "#ebf5ff";
                  else if (isUnmapped) rowBg = "#fffbeb";
                  else if (isEdited)   rowBg = "#f0fdf4";
                  if (isHovered && !isHeader) rowBg = "#e8f0fe";

                  return (
                    <tr
                      key={row.id}
                      // Attach ref so we can scroll-to-row
                      ref={el => { rowRefs.current[row.id] = el; }}
                      onMouseEnter={() => setHoveredRow(row.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        background:   rowBg,
                        borderBottom: `1px solid ${isUnmapped ? "#fcd34d" : "#e5e7eb"}`,
                        height:       isHeader ? 28 : 26,
                        transition:   "background 80ms",
                        outline:      isUnmapped ? "1px solid #fcd34d" : "none",
                      }}
                    >
                      {/* Code */}
                      <td style={{ ...TD, width: COD_W, borderRight: "1px solid #e5e7eb", textAlign: "center", fontFamily: "monospace", fontSize: 10, color: "#9ca3af" }}>
                        {!isHeader && row.mapping_code}
                      </td>

                      {/* Account mapping */}
                      <td style={{ ...TD, width: ACC_W, borderRight: "1px solid #e5e7eb", overflow: "hidden" }}>
                        {!isHeader && !isSubtotal && !isSpecial ? (
                          <MappingDropdown
                            value        = {row.mapping_account_id}
                            accounts     = {chartOfAccounts}
                            displayValue = {row.mapping_account_name || ""}
                            isLowConf    = {(row.mapping_score ?? 100) < 80}
                            onChange     = {(id, acc) => handleMappingChange(row.id, id, acc)}
                          />
                        ) : (
                          <span style={{ fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                            {row.mapping_account_name || ""}
                          </span>
                        )}
                      </td>

                      {/* Line Item label */}
                      <td style={{
                        ...TD, width: LI_W, borderRight: "1px solid #e5e7eb",
                        fontWeight: isHeader || isSpecial ? 600 : isSubtotal ? 500 : 400,
                        fontSize:   isHeader ? 12 : 12,
                        color:      isSpecial ? "#1d4ed8" : isHeader ? "#111827" : "#374151",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {row.description}
                      </td>

                      {/* Value cells */}
                      {data.columns.map((col, ci) => {
                        const val      = row.values[col];
                        const adjKey   = `${row.id}__${col}`;
                        const hasAdj   = !!adjustments[adjKey]?.adjustment;

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
                          <td
                            key={col}
                            title={hasAdj ? `Orig: ${adjustments[adjKey].origVal}  Adj: ${adjustments[adjKey].adjustment}` : undefined}
                            onClick={() => openAdjust(row.id, col, row.description, data.column_labels[ci])}
                            style={{
                              ...TD, width: VAL_W, borderRight: "1px solid #e5e7eb",
                              textAlign: "right",
                              cursor:    data.is_locked ? "default" : "pointer",
                              color:     (val ?? 0) < 0 ? "#dc2626" : "#374151",
                              background: hasAdj ? "#fefce8" : undefined,
                              // small left border indicator if adjusted
                              borderLeft: hasAdj ? "2px solid #f59e0b" : undefined,
                            }}
                            className={!data.is_locked ? "hover:bg-blue-50 transition-colors" : ""}
                          >
                            {fmt(val)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ── Bottom calculation footer ────────────────────────── */}
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
                    <FooterRow
                      label="Calculated NOI"
                      values={summary.noi}
                      columns={data.columns}
                      COD_W={COD_W} ACC_W={ACC_W} LI_W={LI_W} VAL_W={VAL_W}
                      color="#065f46" bold bg="#f0fdf4"
                    />
                    {originalNoi && (
                      <FooterRow
                        label="Original NOI (Adjusted)"
                        values={originalNoi}
                        columns={data.columns}
                        COD_W={COD_W} ACC_W={ACC_W} LI_W={LI_W} VAL_W={VAL_W}
                        color="#374151" bg="#f9fafb"
                        tooltip="NOI from the original uploaded file"
                      />
                    )}
                    {noiVariance && (
                      <FooterRow
                        label="NOI Variance"
                        values={noiVariance}
                        columns={data.columns}
                        COD_W={COD_W} ACC_W={ACC_W} LI_W={LI_W} VAL_W={VAL_W}
                        color="#7c3aed" bg="#faf5ff"
                        showSign
                      />
                    )}
                    {netIncomeSummary && (
                      <>
                        <FooterRow
                          label="Calculated Net Income"
                          values={netIncomeSummary.calc}
                          columns={data.columns}
                          COD_W={COD_W} ACC_W={ACC_W} LI_W={LI_W} VAL_W={VAL_W}
                          color="#1d4ed8" bold bg="#eff6ff"
                        />
                        <FooterRow
                          label="Original Net Income (Adjusted)"
                          values={netIncomeSummary.orig}
                          columns={data.columns}
                          COD_W={COD_W} ACC_W={ACC_W} LI_W={LI_W} VAL_W={VAL_W}
                          color="#374151" bg="#f9fafb"
                          tooltip="Net Income from the original uploaded file"
                        />
                        <FooterRow
                          label="Net Income Variance"
                          values={netIncomeSummary.variance}
                          columns={data.columns}
                          COD_W={COD_W} ACC_W={ACC_W} LI_W={LI_W} VAL_W={VAL_W}
                          color="#7c3aed" bg="#faf5ff"
                          showSign
                        />
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Right mapping info panel ──────────────────────────────── */}
        {showMappingPanel && (
          <div style={{ width: 200, flexShrink: 0, borderLeft: "1px solid #e5e7eb", background: "#fafafa", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>Info</span>
              <button
                onClick={() => setShowMappingPanel(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 2 }}
              >
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

              {/* FIX: now scrolls to first unmapped row */}
              <button
                onClick={scrollToFirstUnmapped}
                style={{
                  display: "block",
                  color: mappingStats.unmapped > 0 ? "#dc2626" : "#6b7280",
                  background: mappingStats.unmapped > 0 ? "#fff1f2" : "none",
                  border: mappingStats.unmapped > 0 ? "1px solid #fca5a5" : "none",
                  borderRadius: 4,
                  cursor: "pointer", fontSize: 11,
                  padding: mappingStats.unmapped > 0 ? "3px 6px" : "2px 0",
                  width: "100%", textAlign: "left",
                  fontWeight: mappingStats.unmapped > 0 ? 600 : 400,
                  marginTop: 2,
                }}
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
                    background:  mappingStats.unmapped === 0 ? "#059669" : "#2563eb",
                    height:      "100%",
                    width:       `${mappingStats.total > 0 ? (mappingStats.mapped / mappingStats.total) * 100 : 0}%`,
                    borderRadius: 4,
                    transition:  "width 0.3s",
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

// ─────────────────────────────────────────────────────────────────────────────
// AdjustEditPopup  — matches RedIQ "Adjust / Edit" modal
// ─────────────────────────────────────────────────────────────────────────────
function AdjustEditPopup({
  rowLabel, colLabel, origValue, savedAdj, savedNotes, onSave, onCancel,
}: {
  rowLabel:   string;
  colLabel:   string;
  origValue:  number;
  savedAdj:   number;
  savedNotes: string;
  onSave:     (adjustment: number, notes: string) => void;
  onCancel:   () => void;
}) {
  const [adj,   setAdj]   = useState(savedAdj.toString());
  const [notes, setNotes] = useState(savedNotes);

  const adjNum  = parseFloat(adj) || 0;
  const adjVal  = origValue + adjNum;

  const fmtNum = (v: number) => v === 0 ? "–" : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    // Backdrop
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onCancel}
    >
      {/* Modal */}
      <div
        style={{ background: "#fff", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", width: 360, overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: "#2563eb", color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Adjust / Edit</span>
          <span style={{ fontSize: 11, opacity: 0.8 }}>{rowLabel} — {colLabel}</span>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Orig. Value (locked) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Orig. Value</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>🔒</span>
              <input
                readOnly
                value={fmtNum(origValue)}
                style={{ width: 120, height: 32, padding: "0 10px", textAlign: "right", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 4, background: "#f9fafb", color: "#6b7280" }}
              />
            </div>
          </div>

          {/* Adjustment (editable) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Adjustment</label>
            <input
              type="number"
              value={adj}
              onChange={e => setAdj(e.target.value)}
              autoFocus
              style={{ width: 120, height: 32, padding: "0 10px", textAlign: "right", fontSize: 13, border: "1px solid #2563eb", borderRadius: 4, outline: "none", boxShadow: "0 0 0 2px rgba(37,99,235,0.15)" }}
            />
          </div>

          {/* Adj. Value (computed, highlighted yellow like RedIQ) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Adj. Value</label>
            <input
              readOnly
              value={fmtNum(adjVal)}
              style={{ width: 120, height: 32, padding: "0 10px", textAlign: "right", fontSize: 13, fontWeight: 600, border: "1px solid #e5e7eb", borderRadius: 4, background: "#fefce8", color: "#111827" }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 13, color: "#374151", fontWeight: 500, display: "block", marginBottom: 6 }}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "8px 10px", fontSize: 12, border: "1px solid #d1d5db", borderRadius: 4, resize: "vertical", outline: "none", fontFamily: "inherit" }}
              placeholder="Optional note about this adjustment…"
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 18, color: "#9ca3af", cursor: "pointer" }} title="Help">?</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onCancel}
              style={{ height: 32, padding: "0 16px", border: "1px solid #d1d5db", borderRadius: 5, fontSize: 13, cursor: "pointer", background: "#fff", color: "#374151" }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(adjNum, notes)}
              style={{ height: 32, padding: "0 20px", border: "none", borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#2563eb", color: "#fff" }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Style constants
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// FooterRow
// ─────────────────────────────────────────────────────────────────────────────
function FooterRow({
  label, values, columns, COD_W, ACC_W, LI_W, VAL_W,
  color, bold = false, bg = "#fff", showSign = false, tooltip,
}: {
  label:   string;
  values:  Record<string, number>;
  columns: string[];
  COD_W: number; ACC_W: number; LI_W: number; VAL_W: number;
  color?:    string;
  bold?:     boolean;
  bg?:       string;
  showSign?: boolean;
  tooltip?:  string;
}) {
  const fmt = (v: number) => {
    const abs = Math.abs(v);
    const s   = abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (showSign && v > 0) return `+$ ${s}`;
    return v < 0 ? `($ ${s})` : v === 0 ? "–" : `$ ${s}`;
  };

  return (
    <tr style={{ background: bg, borderBottom: "1px solid #e5e7eb", height: 28 }}>
      <td style={{ ...TD, width: COD_W, borderRight: "1px solid #e5e7eb" }} />
      <td style={{ ...TD, width: ACC_W, borderRight: "1px solid #e5e7eb" }} />
      <td style={{ ...TD, width: LI_W, borderRight: "1px solid #e5e7eb", fontWeight: bold ? 700 : 600, color: color || "#111827" }}
        title={tooltip}>
        {label}
        {tooltip && <span style={{ marginLeft: 4, fontSize: 10, color: "#9ca3af" }}>ⓘ</span>}
      </td>
      {columns.map(col => {
        const v = values[col] || 0;
        let cellColor = color || "#111827";
        if (showSign) cellColor = v > 0 ? "#059669" : v < 0 ? "#dc2626" : "#9ca3af";
        else if (v < 0) cellColor = "#dc2626";
        return (
          <td key={col} style={{ ...TD, width: VAL_W, borderRight: "1px solid #e5e7eb", textAlign: "right", fontWeight: bold ? 700 : 600, color: cellColor }}>
            {fmt(v)}
          </td>
        );
      })}
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MappingDropdown — renders dropdown via React Portal on document.body so it
// is NEVER clipped by table overflow:hidden parents.
// ─────────────────────────────────────────────────────────────────────────────
function MappingDropdown({ value, accounts, displayValue, isLowConf, onChange }: {
  value:        number | null;
  accounts:     ChartOfAccountItem[];
  displayValue: string;
  isLowConf?:   boolean;
  onChange:     (id: number | null, account?: ChartOfAccountItem) => void;
}) {
  const [open,    setOpen]    = useState(false);
  const [search,  setSearch]  = useState("");
  const [pos,     setPos]     = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // Compute portal position from trigger button's bounding rect
  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropH = 320;
      const top = spaceBelow >= dropH ? rect.bottom + 2 : rect.top - dropH - 2;
      setPos({ top: top + window.scrollY, left: rect.left + window.scrollX, width: Math.max(rect.width, 260) });
    }
    setOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      const portal = document.getElementById("mapping-portal-active");
      if (triggerRef.current?.contains(target)) return;
      if (portal?.contains(target)) return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const filtered = useMemo(() =>
    accounts.filter(a =>
      a.account_name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
    ), [accounts, search]
  );

  const incomeList  = filtered.filter(a => !a.is_expense);
  const expenseList = filtered.filter(a =>  a.is_expense);

  const select = (a: ChartOfAccountItem) => {
    onChange(a.id, a);
    setOpen(false);
    setSearch("");
  };

  const dropdownEl = open ? (
    <div
      id="mapping-portal-active"
      style={{
        position: "absolute",
        top:      pos.top,
        left:     pos.left,
        width:    pos.width,
        zIndex:   99999,
        background: "#fff",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        maxHeight: 320,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Search input */}
      <div style={{ padding: "6px 8px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <input
          ref={inputRef}
          placeholder="Search accounts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === "Escape") { setOpen(false); setSearch(""); } }}
          style={{ width: "100%", height: 26, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 8px", fontSize: 11, outline: "none" }}
        />
      </div>

      {/* Options list */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {incomeList.length > 0 && (
          <>
            <div style={GROUP_LABEL}>Income</div>
            {incomeList.map(a => (
              <button
                key={a.id}
                onMouseDown={e => { e.preventDefault(); select(a); }}
                style={{ ...OPTION_BTN, background: a.id === value ? "#eff6ff" : "transparent", fontWeight: a.id === value ? 600 : 400 }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.account_name}</span>
                <span style={{ marginLeft: 8, fontSize: 10, color: "#9ca3af", fontFamily: "monospace", flexShrink: 0 }}>[{a.code}]</span>
              </button>
            ))}
          </>
        )}
        {expenseList.length > 0 && (
          <>
            <div style={GROUP_LABEL}>Expense</div>
            {expenseList.map(a => (
              <button
                key={a.id}
                onMouseDown={e => { e.preventDefault(); select(a); }}
                style={{ ...OPTION_BTN, background: a.id === value ? "#eff6ff" : "transparent", fontWeight: a.id === value ? 600 : 400 }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.account_name}</span>
                <span style={{ marginLeft: 8, fontSize: 10, color: "#9ca3af", fontFamily: "monospace", flexShrink: 0 }}>[{a.code}]</span>
              </button>
            ))}
          </>
        )}
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", padding: 12, fontSize: 11, color: "#9ca3af" }}>No results</p>
        )}
      </div>

      {/* Clear option */}
      {value !== null && (
        <div style={{ borderTop: "1px solid #e5e7eb", flexShrink: 0 }}>
          <button
            onMouseDown={e => { e.preventDefault(); onChange(null); setOpen(false); }}
            style={{ ...OPTION_BTN, color: "#dc2626" }}
          >
            Clear mapping
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        ref={triggerRef}
        onClick={openDropdown}
        title={displayValue || "Select an Option"}
        style={{
          display: "block", width: "100%", textAlign: "left",
          background: "none", border: "none", cursor: "pointer",
          fontSize: 11, padding: "1px 4px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color:     !displayValue ? "#9ca3af" : isLowConf ? "#92400e" : "#374151",
          fontStyle: !displayValue ? "italic" : "normal",
        }}
      >
        {displayValue || "Select an Option"}
      </button>

      {/* Portal: renders on document.body, never clipped by overflow:hidden */}
      {open && createPortal(dropdownEl, document.body)}
    </div>
  );
}

const GROUP_LABEL: React.CSSProperties = {
  padding: "4px 10px 2px",
  fontSize: 9,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#9ca3af",
  background: "#f9fafb",
  position: "sticky",
  top: 0,
};

const OPTION_BTN: React.CSSProperties = {
  display: "flex",
  width: "100%",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "5px 10px",
  fontSize: 11,
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  color: "#374151",
  background: "transparent",
};
