import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Highlighter } from "lucide-react";
import { osDataApi, osMappingApi } from "@/services/operatingStatementApi";
import type { OsBatchData, OsLineItemRow, ChartOfAccountItem } from "@/services/operatingStatementApi";
import { SpecifyExpensesModal } from "./SpecifyExpensesModal";
import { OsMappingPanel } from "./OsMappingPanel";
import { toast } from "sonner";

interface Props {
  dealId: string;
  batchId: string;
  onSave: () => void;
  onCancel: () => void;
}

export function OsEditableGrid({ dealId, batchId, onSave, onCancel }: Props) {
  const [data, setData] = useState<OsBatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editedRows, setEditedRows] = useState<Set<string>>(new Set());
  const [highlightOutliers, setHighlightOutliers] = useState(false);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccountItem[]>([]);
  const [showMappingPanel, setShowMappingPanel] = useState(true);
  const [view, setView] = useState<"actuals" | "proforma">("actuals");
  const [adjustedValues, setAdjustedValues] = useState(true);
  const [groupBy, setGroupBy] = useState("original");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load data
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

  // Cell edit handler
  const handleCellEdit = useCallback((rowId: string, colKey: string, value: number) => {
    setData(prev => {
      if (!prev) return prev;
      const newRows = prev.rows.map(r => {
        if (r.id !== rowId) return r;
        return { ...r, values: { ...r.values, [colKey]: value } };
      });
      return { ...prev, rows: newRows };
    });
    setEditedRows(prev => new Set(prev).add(rowId));
  }, []);

  // Mapping change handler
  const handleMappingChange = useCallback((rowId: string, accountId: number | null, account?: ChartOfAccountItem) => {
    setData(prev => {
      if (!prev) return prev;
      const newRows = prev.rows.map(r => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          mapping_account_id: accountId,
          mapping_account_name: account?.account_name || "",
          mapping_code: account?.code || "",
          is_expense: account?.is_expense ?? r.is_expense,
        };
      });
      return { ...prev, rows: newRows };
    });
    setEditedRows(prev => new Set(prev).add(rowId));
  }, []);

  // Calculate summary
  const summary = useMemo(() => {
    if (!data) return null;
    const cols = data.columns;
    const income: Record<string, number> = {};
    const expense: Record<string, number> = {};
    const noi: Record<string, number> = {};

    cols.forEach(c => { income[c] = 0; expense[c] = 0; noi[c] = 0; });

    data.rows.forEach(r => {
      if (r.is_section_header || r.is_subtotal) return;
      cols.forEach(c => {
        const v = r.values[c] || 0;
        if (r.is_expense) expense[c] += Math.abs(v);
        else income[c] += v;
      });
    });

    cols.forEach(c => { noi[c] = income[c] - expense[c]; });

    return { income, expense, noi };
  }, [data]);

  // Mapping stats
  const mappingStats = useMemo(() => {
    if (!data) return { mapped: 0, unmapped: 0 };
    const lineItems = data.rows.filter(r => !r.is_section_header && !r.is_subtotal);
    const mapped = lineItems.filter(r => r.mapping_account_id !== null).length;
    return { mapped, unmapped: lineItems.length - mapped };
  }, [data]);

  // Submit handler
  const handleSubmit = () => {
    setShowExpenseModal(true);
  };

  const handleExpenseConfirm = async (firstExpenseRow: string | null, noiRow: string | null, niRow: string | null) => {
    setShowExpenseModal(false);
    if (!data) return;
    setSaving(true);
    try {
      const changedRows = data.rows
        .filter(r => editedRows.has(r.id))
        .map(r => ({ id: r.id, mapping_account_id: r.mapping_account_id, values: r.values }));

      await osDataApi.saveAll(dealId, data.batch_id, {
        rows: changedRows.length > 0 ? changedRows : data.rows.map(r => ({ id: r.id, mapping_account_id: r.mapping_account_id, values: r.values })),
        first_expense_row: firstExpenseRow || undefined,
        noi_row: noiRow || undefined,
        ni_row: niRow || undefined,
      });

      await osDataApi.lockBatch(dealId, data.batch_id);
      toast.success("Operating statement saved successfully");
      onSave();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const fmtCurrency = (v: number | undefined) => {
    if (v === undefined || v === null) return "-";
    const abs = Math.abs(v);
    const formatted = abs.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return v < 0 ? `(${formatted})` : formatted;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">No operating statement data available.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Control bar */}
      <div className="border-b px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0 bg-background">
        <div className="flex items-center gap-3">
          {/* View selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">View:</span>
            <select
              value={view}
              onChange={(e) => setView(e.target.value as any)}
              className="h-7 px-2 text-xs border rounded bg-background text-foreground"
            >
              <option value="actuals">Actuals</option>
              <option value="proforma">Proforma</option>
            </select>
          </div>

          {/* Adjusted Values */}
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <span className="text-muted-foreground">Adjusted Values</span>
            <input
              type="checkbox"
              checked={adjustedValues}
              onChange={() => setAdjustedValues(!adjustedValues)}
              className="h-3.5 w-3.5 rounded border accent-[hsl(var(--primary))]"
            />
          </label>

          {/* Group By */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Group by:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="h-7 px-2 text-xs border rounded bg-background text-foreground"
            >
              <option value="original">Original Order</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setShowMappingPanel(!showMappingPanel)}>
            Mappings
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
            This Batch
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setHighlightOutliers(!highlightOutliers)}
          >
            <Highlighter className="h-3 w-3" />
            Highlight Outliers
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
            <Download className="h-3 w-3" /> Export to Excel
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Table area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Action bar */}
          <div className="flex items-center justify-end px-4 py-2 border-b flex-shrink-0 gap-2">
            <Button
              size="sm"
              className="bg-[hsl(200,70%,45%)] hover:bg-[hsl(200,70%,40%)] text-white"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Saving…" : "Submit"}
            </Button>
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>

          {/* Scrollable table */}
          <div ref={scrollRef} className="flex-1 overflow-auto">
            <table className="w-full text-[13px] border-collapse min-w-[900px]">
              {/* Header */}
              <thead className="sticky top-0 z-10 bg-background">
                {/* Row: Frequency */}
                <tr className="border-b">
                  <th className="sticky left-0 bg-muted/50 z-20 text-left px-3 py-1.5 font-medium text-muted-foreground border-r min-w-[60px]">
                    
                  </th>
                  <th className="sticky left-[60px] bg-muted/50 z-20 text-left px-3 py-1.5 font-medium text-muted-foreground border-r min-w-[140px]">
                    Account
                  </th>
                  <th className="sticky left-[200px] bg-muted/50 z-20 text-left px-3 py-1.5 font-medium text-muted-foreground border-r min-w-[180px]">
                    Line Item
                  </th>
                  {data.columns.map((col, i) => (
                    <th key={col} className="bg-muted/50 text-center px-2 py-1.5 font-normal text-muted-foreground min-w-[100px] border-r">
                      <select className="text-xs bg-transparent border-0 text-center w-full cursor-pointer text-muted-foreground">
                        <option>Monthly</option>
                        <option>Annual</option>
                      </select>
                    </th>
                  ))}
                </tr>
                {/* Row: Month labels */}
                <tr className="border-b bg-muted/30">
                  <th className="sticky left-0 bg-muted/30 z-20 border-r px-3 py-1.5"></th>
                  <th className="sticky left-[60px] bg-muted/30 z-20 border-r px-3 py-1.5"></th>
                  <th className="sticky left-[200px] bg-muted/30 z-20 border-r px-3 py-1.5"></th>
                  {data.column_labels.map((label, i) => (
                    <th key={i} className="bg-muted/30 text-center px-2 py-1.5 font-medium text-xs text-foreground min-w-[100px] border-r">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.rows.map((row, rowIdx) => {
                  const isSection = row.is_section_header;
                  const isSubtotal = row.is_subtotal;
                  const isEdited = editedRows.has(row.id);
                  const isLowConfidence = (row.mapping_score ?? 100) < 80;
                  const isNegativeRow = row.is_negative;
                  const isHighlighted = highlightOutliers && isLowConfidence;

                  return (
                    <tr
                      key={row.id}
                      className={`border-b transition-colors ${
                        isSection
                          ? "bg-muted/40 font-semibold"
                          : isSubtotal
                          ? "bg-muted/20 font-semibold"
                          : isEdited
                          ? "bg-yellow-50/50"
                          : isHighlighted
                          ? "bg-amber-50"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      {/* Code */}
                      <td className="sticky left-0 bg-inherit z-10 px-3 py-1 border-r text-xs text-muted-foreground font-mono">
                        {row.mapping_code || ""}
                      </td>
                      {/* Account */}
                      <td className="sticky left-[60px] bg-inherit z-10 px-3 py-1 border-r text-xs">
                        {!isSection && !isSubtotal ? (
                          <MappingDropdown
                            value={row.mapping_account_id}
                            accounts={chartOfAccounts}
                            displayValue={row.mapping_account_name || ""}
                            onChange={(id, acc) => handleMappingChange(row.id, id, acc)}
                          />
                        ) : (
                          <span className="text-muted-foreground">{row.mapping_account_name || ""}</span>
                        )}
                      </td>
                      {/* Line Item */}
                      <td className={`sticky left-[200px] bg-inherit z-10 px-3 py-1 border-r ${
                        isSection ? "text-foreground" : "text-foreground"
                      }`}>
                        {row.description}
                      </td>
                      {/* Values */}
                      {data.columns.map((col) => {
                        const val = row.values[col];
                        if (isSection) {
                          return <td key={col} className="px-2 py-1 border-r"></td>;
                        }
                        return (
                          <td key={col} className="px-1 py-0.5 border-r text-right">
                            <EditableCell
                              value={val}
                              isNegative={isNegativeRow}
                              onChange={(v) => handleCellEdit(row.id, col, v)}
                              readOnly={data.is_locked}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary / NOI section */}
            {summary && (
              <div className="sticky bottom-0 bg-background border-t-2 border-foreground/20">
                <table className="w-full text-[13px] border-collapse min-w-[900px]">
                  <tbody>
                    <SummaryRow label="Calculated NOI" values={summary.noi} columns={data.columns} className="font-semibold" />
                    {data.summary.original_noi && (
                      <SummaryRow label="Original NOI (Adjusted)" values={data.summary.original_noi} columns={data.columns} className="text-muted-foreground" />
                    )}
                    {data.summary.noi_variance && (
                      <SummaryRow label="NOI Variance" values={data.summary.noi_variance} columns={data.columns} className="text-muted-foreground" />
                    )}
                    {data.summary.total_variance && (
                      <SummaryRow label="Total Variance" values={data.summary.total_variance} columns={data.columns} className="font-semibold bg-yellow-50" />
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Mapping info */}
        {showMappingPanel && (
          <OsMappingPanel
            mapped={mappingStats.mapped}
            unmapped={mappingStats.unmapped}
            onClose={() => setShowMappingPanel(false)}
          />
        )}
      </div>

      {/* Expense modal */}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function EditableCell({ value, isNegative, onChange, readOnly }: {
  value: number | undefined;
  isNegative?: boolean;
  onChange: (v: number) => void;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const display = useMemo(() => {
    if (value === undefined || value === null) return "-";
    const abs = Math.abs(value);
    const formatted = abs.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return value < 0 ? `(${formatted})` : formatted;
  }, [value]);

  const startEdit = () => {
    if (readOnly) return;
    setLocalVal(value?.toString() || "");
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    setEditing(false);
    const num = parseFloat(localVal.replace(/[,$()]/g, ''));
    if (!isNaN(num)) {
      onChange(localVal.includes('(') ? -Math.abs(num) : num);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitEdit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full h-6 px-1 text-right text-[13px] border border-[hsl(var(--primary))] rounded-sm bg-background focus:outline-none"
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={startEdit}
      className={`px-1 py-0.5 cursor-text text-right rounded-sm hover:bg-muted/30 transition-colors min-h-[24px] ${
        (value ?? 0) < 0 ? "text-destructive" : ""
      }`}
    >
      {display}
    </div>
  );
}

function MappingDropdown({ value, accounts, displayValue, onChange }: {
  value: number | null;
  accounts: ChartOfAccountItem[];
  displayValue: string;
  onChange: (id: number | null, account?: ChartOfAccountItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = accounts.filter(a =>
    a.account_name.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-left text-xs truncate w-full hover:text-[hsl(var(--primary))] transition-colors"
      >
        {displayValue || (
          <span className="text-muted-foreground italic">Select an Option</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 bg-background border rounded-md shadow-lg w-64 max-h-64 overflow-hidden">
          <div className="p-1.5 border-b">
            <input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-7 px-2 text-xs border rounded bg-background focus:outline-none"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.map(a => (
              <button
                key={a.id}
                onClick={() => { onChange(a.id, a); setOpen(false); }}
                className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors ${
                  a.id === value ? "bg-muted/50 font-medium" : ""
                }`}
              >
                {a.account_name} <span className="text-muted-foreground">[{a.code}]</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, values, columns, className = "" }: {
  label: string;
  values: Record<string, number>;
  columns: string[];
  className?: string;
}) {
  const fmtCurrency = (v: number) => {
    const abs = Math.abs(v);
    const formatted = abs.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return v < 0 ? `(${formatted})` : formatted;
  };

  return (
    <tr className={`border-b ${className}`}>
      <td className="sticky left-0 bg-inherit z-10 px-3 py-1.5 border-r min-w-[60px]"></td>
      <td className="sticky left-[60px] bg-inherit z-10 px-3 py-1.5 border-r min-w-[140px]"></td>
      <td className="sticky left-[200px] bg-inherit z-10 px-3 py-1.5 border-r min-w-[180px] text-sm">
        {label}
      </td>
      {columns.map(col => (
        <td key={col} className="px-2 py-1.5 text-right text-[13px] border-r min-w-[100px]">
          {fmtCurrency(values[col] || 0)}
        </td>
      ))}
    </tr>
  );
}
