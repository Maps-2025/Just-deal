import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OsLineItemRow } from "@/services/operatingStatementApi";

interface Props {
  rows: OsLineItemRow[];
  onConfirm: (firstExpenseRow: string | null, noiRow: string | null, niRow: string | null) => void;
  onCancel: () => void;
}

export function SpecifyExpensesModal({ rows, onConfirm, onCancel }: Props) {
  const lineItems = useMemo(() =>
    rows.filter(r => !r.is_section_header || r.description.trim().length > 0)
      .map(r => ({ id: r.id, label: r.description })),
    [rows]
  );

  // Auto-detect defaults
  const defaultExpense = useMemo(() => {
    const idx = lineItems.findIndex(item =>
      item.label.toLowerCase().includes("expense")
    );
    return idx >= 0 ? lineItems[idx].id : "";
  }, [lineItems]);

  const defaultNoi = useMemo(() => {
    const idx = lineItems.findIndex(item =>
      item.label.toLowerCase().includes("noi") ||
      item.label.toLowerCase().includes("net operating income")
    );
    return idx >= 0 ? lineItems[idx].id : "";
  }, [lineItems]);

  const defaultNi = useMemo(() => {
    const idx = lineItems.findIndex(item =>
      item.label.toLowerCase().includes("net income")
    );
    return idx >= 0 ? lineItems[idx].id : "";
  }, [lineItems]);

  const [firstExpenseRow, setFirstExpenseRow] = useState(defaultExpense);
  const [noiRow, setNoiRow] = useState(defaultNoi);
  const [niRow, setNiRow] = useState(defaultNi);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-[520px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[hsl(200,70%,45%)] px-6 py-3.5 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">Please Specify Expenses</h2>
          <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* First Expense Row */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">The First Expense Row is</label>
            </div>
            <select
              value={firstExpenseRow}
              onChange={(e) => setFirstExpenseRow(e.target.value)}
              className="w-full h-9 px-3 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              <option value="">~ Please Select ~</option>
              {lineItems.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <p className="text-xs text-[hsl(var(--primary))] mt-1">
              (All line items after this row will also be treated as expenses.)
            </p>
          </div>

          {/* NOI Row */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">The NOI Row is</label>
            <select
              value={noiRow}
              onChange={(e) => setNoiRow(e.target.value)}
              className="w-full h-9 px-3 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              <option value="">~ No NOI ~</option>
              {lineItems.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>

          {/* NI Row */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">The NI Row is</label>
            <select
              value={niRow}
              onChange={(e) => setNiRow(e.target.value)}
              className="w-full h-9 px-3 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              <option value="">~ Please Select ~</option>
              {lineItems.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button
            size="sm"
            className="bg-[hsl(200,70%,45%)] hover:bg-[hsl(200,70%,40%)] text-white"
            onClick={() => onConfirm(
              firstExpenseRow || null,
              noiRow || null,
              niRow || null
            )}
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
