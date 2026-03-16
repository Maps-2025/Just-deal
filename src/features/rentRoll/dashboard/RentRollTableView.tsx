import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useRentRollUnitsDetailed, useRentRollList } from "@/hooks/useRentRoll";
import { Pencil, FileSpreadsheet, AlertCircle, ChevronDown } from "lucide-react";
import { AnomalyPanel } from "./AnomalyPanel";
import type { RentRollRecord, RentRollUnitRow } from "@/services/rentRollApi";

const ALL_COLUMNS = [
  { key: "unit_no", label: "Unit No", align: "left" },
  { key: "floor_plan", label: "Floor Plan", align: "left" },
  { key: "net_sqft", label: "Net sf", align: "right", fmt: "num" },
  { key: "bedrooms", label: "Bedrooms", align: "center", fmt: "num" },
  { key: "bathrooms", label: "Baths", align: "center", fmt: "num" },
  { key: "unit_type", label: "Unit Type", align: "left" },
  { key: "lease_type", label: "Lease Type", align: "left" },
  { key: "renovation_status", label: "Renovation Status", align: "left" },
  { key: "occupancy_status", label: "Occupancy", align: "left" },
  { key: "market_rent", label: "Market Rent", align: "right", fmt: "dollar" },
  { key: "contractual_rent", label: "Contractual Rent", align: "right", fmt: "dollar" },
  { key: "recurring_concessions", label: "Recurring Conc.", align: "right", fmt: "dollar" },
  { key: "net_effective_rent", label: "Net Effective Rent", align: "right", fmt: "dollar" },
  { key: "lease_start_date", label: "Lease Start", align: "left" },
  { key: "lease_end_date", label: "Lease Exp.", align: "left" },
  { key: "tenant_name", label: "Tenant", align: "left" },
] as const;

interface RentRollTableViewProps {
  dealId: string;
  rentRollId: string;
  rentRolls: RentRollRecord[];
  onNavigate?: (view: string) => void;
}

export function RentRollTableView({ dealId, rentRollId, rentRolls, onNavigate }: RentRollTableViewProps) {
  const [selectedRRId, setSelectedRRId] = useState(rentRollId);
  const [showAnomalies, setShowAnomalies] = useState(false);
  const [groupBy, setGroupBy] = useState<string>("none");
  const [monthlyRent, setMonthlyRent] = useState("per_unit");

  const { data: units = [], isLoading } = useRentRollUnitsDetailed(dealId, selectedRRId);
  const selectedRR = rentRolls.find(r => r.id === selectedRRId);

  const anomalies = useMemo(() => {
    return units.filter(u => {
      if (!u.contractual_rent && u.occupancy_status?.toLowerCase() === "occupied") return true;
      if (u.market_rent && u.contractual_rent && u.contractual_rent < u.market_rent * 0.7) return true;
      return false;
    }).map(u => ({
      unitNo: u.unit_no || "?",
      issue: !u.contractual_rent
        ? "This unit has no Contractual Rent"
        : `Contractual Rent is more than 30% below Market Rent`,
    }));
  }, [units]);

  const fmtDollar = (n: number | null) => n != null ? `$ ${n.toLocaleString()}` : "";
  const fmtNum = (n: number | null) => n != null ? n.toLocaleString() : "";

  const cellValue = (u: RentRollUnitRow, col: typeof ALL_COLUMNS[number]) => {
    const v = (u as any)[col.key];
    if (v == null) return "—";
    if ("fmt" in col && col.fmt === "dollar") return fmtDollar(v);
    if ("fmt" in col && col.fmt === "num") return fmtNum(v);
    return String(v);
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* Left sidebar */}
      <div className="w-[260px] shrink-0 border-r bg-background overflow-y-auto sticky top-0 h-full">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Report Settings</h3>
            <div className="flex gap-0.5">
              <span className="w-0.5 h-4 bg-muted-foreground/40 rounded" />
              <span className="w-0.5 h-4 bg-muted-foreground/40 rounded" />
              <span className="w-0.5 h-4 bg-muted-foreground/40 rounded" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">Rent Roll</span>
              <button onClick={() => onNavigate?.("rent-roll-manage")} className="text-xs text-[hsl(var(--primary))] hover:underline font-medium">
                ⚙ Manage
              </button>
            </div>
            <select
              className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
              value={selectedRRId}
              onChange={e => setSelectedRRId(e.target.value)}
            >
              {rentRolls.map(rr => (
                <option key={rr.id} value={rr.id}>
                  {new Date(rr.report_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </option>
              ))}
            </select>
          </div>

          {anomalies.length > 0 && (
            <button
              onClick={() => setShowAnomalies(!showAnomalies)}
              className="text-[hsl(var(--primary))] text-sm hover:underline flex items-center gap-1 font-medium"
            >
              Anomalies Detected <AlertCircle className="h-3.5 w-3.5" />
            </button>
          )}

          <div className="border-t pt-3">
            <label className="text-xs text-muted-foreground mb-1 block">Monthly Rent</label>
            <select className="w-full border rounded px-2 py-1.5 text-sm bg-background" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)}>
              <option value="per_unit">$ per unit</option>
              <option value="total">$ total</option>
              <option value="per_sf">$ per sf</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground">Group By:</label>
            </div>
            <select className="w-full border rounded px-2 py-1.5 text-sm bg-background" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
              <option value="none">None</option>
              <option value="floor_plan">Floor Plan</option>
              <option value="unit_type">Unit Type</option>
              <option value="lease_type">Lease Type</option>
              <option value="renovation_status">Renovation Status</option>
              <option value="occupancy_status">Occupancy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
          <span className="text-sm text-[hsl(var(--primary))]">
            0 of {units.length} units selected
          </span>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border rounded text-sm text-[hsl(var(--primary))] hover:bg-muted/50 transition-colors">
              <Pencil className="h-3.5 w-3.5" /> Edit Rent Roll
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border rounded text-sm text-[hsl(var(--primary))] hover:bg-muted/50 transition-colors">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Export to Excel
            </button>
          </div>
        </div>

        {/* Anomaly panel */}
        {showAnomalies && anomalies.length > 0 && (
          <AnomalyPanel anomalies={anomalies} onClose={() => setShowAnomalies(false)} />
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <table className="w-full text-xs border-collapse min-w-[1600px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-muted/80 border-b">
                  {ALL_COLUMNS.map(col => (
                    <th
                      key={col.key}
                      className={cn(
                        "px-2.5 py-2 font-semibold text-foreground whitespace-nowrap border-r last:border-r-0",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.align === "left" && "text-left"
                      )}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
                {/* Filter row */}
                <tr className="bg-muted/40 border-b">
                  {ALL_COLUMNS.map(col => (
                    <th key={`f-${col.key}`} className="px-1 py-1 border-r last:border-r-0">
                      <input
                        type="text"
                        className="w-full border rounded px-1.5 py-0.5 text-xs bg-background text-foreground"
                        placeholder=""
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {units.map((u, i) => {
                  const isAnomaly = anomalies.some(a => a.unitNo === u.unit_no);
                  return (
                    <tr
                      key={u.id}
                      className={cn(
                        "border-b hover:bg-[hsl(var(--primary)/0.04)] transition-colors",
                        i % 2 === 0 && "bg-muted/10",
                        isAnomaly && "bg-warning/10"
                      )}
                    >
                      {ALL_COLUMNS.map(col => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-2.5 py-1.5 whitespace-nowrap border-r last:border-r-0 font-mono",
                            col.align === "right" && "text-right",
                            col.align === "center" && "text-center"
                          )}
                        >
                          {cellValue(u, col)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
