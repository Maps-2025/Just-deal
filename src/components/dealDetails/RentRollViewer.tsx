import { cn } from "@/lib/utils";
import type { RentRollUnit } from "@/types/deals";

interface RentRollViewerProps {
  units: RentRollUnit[];
}

export function RentRollViewer({ units }: RentRollViewerProps) {
  if (units.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-sm">No Rent Roll data available.</p>
        <button className="text-primary text-sm font-medium mt-2 hover:underline">
          Upload Rent Roll
        </button>
      </div>
    );
  }

  const formatCurrency = (n: number | null) =>
    n != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n)
      : "—";

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
          <tr className="border-b">
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Unit</th>
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Floor Plan</th>
            <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Sq Ft</th>
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Status</th>
            <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Contractual Rent</th>
            <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Market Rent</th>
            <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Variance</th>
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Lease End</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit, i) => {
            const variance =
              unit.market_rent != null && unit.contractual_rent != null
                ? unit.market_rent - unit.contractual_rent
                : null;
            return (
              <tr
                key={unit.id}
                className={cn(
                  "h-11 border-b transition-colors hover:bg-primary/5",
                  i % 2 === 0 && "bg-muted/30"
                )}
              >
                <td className="px-4 font-mono text-sm">{unit.unit_no || "—"}</td>
                <td className="px-4 text-muted-foreground">{unit.floor_plan || "—"}</td>
                <td className="px-4 text-right font-mono">{unit.net_sqft?.toLocaleString() ?? "—"}</td>
                <td className="px-4">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-sm",
                      unit.occupancy_status === "Occupied" && "bg-success/10 text-success",
                      unit.occupancy_status === "Vacant" && "bg-destructive/10 text-destructive",
                      unit.occupancy_status === "Notice" && "bg-warning/10 text-warning"
                    )}
                  >
                    {unit.occupancy_status || "—"}
                  </span>
                </td>
                <td className="px-4 text-right font-mono">{formatCurrency(unit.contractual_rent)}</td>
                <td className="px-4 text-right font-mono">{formatCurrency(unit.market_rent)}</td>
                <td className={cn("px-4 text-right font-mono", variance != null && (variance > 0 ? "text-success" : "text-destructive"))}>
                  {variance != null ? `${variance > 0 ? "+" : ""}${formatCurrency(variance)}` : "—"}
                </td>
                <td className="px-4 text-muted-foreground">{unit.lease_end_date || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
