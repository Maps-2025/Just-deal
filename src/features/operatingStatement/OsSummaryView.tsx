import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { osDataApi } from "@/services/operatingStatementApi";
import type { OsBatchData } from "@/services/operatingStatementApi";

interface Props {
  dealId: string;
  onUpload: () => void;
  onNavigate?: (view: string) => void;
}

export function OsSummaryView({ dealId, onUpload, onNavigate }: Props) {
  const [data, setData] = useState<OsBatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("adjusted");
  const [units, setUnits] = useState("total");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const d = await osDataApi.getBatchData(dealId);
        setData(d);
      } catch {
        // No data available
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dealId]);

  const fmtCurrency = (v: number) => {
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

  return (
    <div className="flex-1 overflow-auto">
      {/* Controls */}
      <div className="border-b px-6 py-2 flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">View:</span>
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="h-7 px-2 text-xs border rounded bg-background text-foreground"
          >
            <option value="adjusted">Adjusted Values</option>
            <option value="original">Original Values</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Units:</span>
          <select
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            className="h-7 px-2 text-xs border rounded bg-background text-foreground"
          >
            <option value="total">Total</option>
            <option value="per_unit">Per Unit</option>
            <option value="per_sf">Per SF</option>
          </select>
        </div>
      </div>

      {!data || data.rows.length === 0 ? (
        <div className="p-6">
          <div className="text-center py-16">
            <h2 className="text-lg font-semibold text-foreground mb-2">Operating Statement Summary</h2>
            <p className="text-sm text-muted-foreground mb-6">No operating statement data available for this deal.</p>
            <Button
              className="bg-[hsl(200,70%,45%)] hover:bg-[hsl(200,70%,40%)] text-white"
              onClick={onUpload}
            >
              Upload Operating Statement
            </Button>
          </div>

          {/* Placeholder cards */}
          <div className="grid grid-cols-2 gap-6 mt-8 max-w-4xl mx-auto">
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Operating Statement Summary</h3>
                <Download className="h-4 w-4 text-[hsl(var(--primary))] cursor-pointer" />
              </div>
              <p className="text-xs text-muted-foreground text-center py-10">Upload data to view summary</p>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Historical Operating Performance</h3>
                <Download className="h-4 w-4 text-[hsl(var(--primary))] cursor-pointer" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground"></th>
                      <th className="text-right py-2 font-medium text-muted-foreground px-3">T12</th>
                      <th className="text-right py-2 font-medium text-muted-foreground px-3">T3</th>
                      <th className="text-right py-2 font-medium text-muted-foreground px-3">T1</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">No data</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                Operating expenses in all column show T0 amounts.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 max-w-6xl mx-auto">
          <h2 className="text-lg font-semibold text-foreground mb-6 text-center">Operating Statement Summary</h2>

          {/* Summary table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground min-w-[200px]">Line Item</th>
                    {data.column_labels.map((label, i) => (
                      <th key={i} className="text-right px-3 py-2.5 font-medium text-foreground min-w-[100px]">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b transition-colors ${
                        row.is_section_header
                          ? "bg-muted/30 font-semibold"
                          : row.is_subtotal
                          ? "bg-muted/20 font-semibold"
                          : "hover:bg-muted/10"
                      }`}
                    >
                      <td className={`px-4 py-1.5 ${row.is_section_header ? "text-foreground" : ""}`}>
                        {row.description}
                      </td>
                      {data.columns.map((col) => (
                        <td
                          key={col}
                          className={`px-3 py-1.5 text-right ${
                            (row.values[col] ?? 0) < 0 ? "text-destructive" : ""
                          }`}
                        >
                          {row.is_section_header ? "" : fmtCurrency(row.values[col] ?? 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
