import { cn } from "@/lib/utils";
import { RentRollUnit } from "@/types/deals";

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

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
          <tr className="border-b">
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Unit</th>
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Type</th>
            <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Sq Ft</th>
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Status</th>
            <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Current Rent</th>
            <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Market Rent</th>
            <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Variance</th>
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Lease End</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit, i) => {
            const variance = unit.marketRent - unit.currentRent;
            return (
              <tr
                key={unit.id}
                className={cn(
                  "h-11 border-b transition-colors hover:bg-primary/5",
                  i % 2 === 0 && "bg-muted/30"
                )}
              >
                <td className="px-4 font-mono text-sm">{unit.unitNumber}</td>
                <td className="px-4 text-muted-foreground">{unit.unitType}</td>
                <td className="px-4 text-right font-mono">{unit.sqft.toLocaleString()}</td>
                <td className="px-4">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-sm",
                      unit.status === "Occupied" && "bg-success/10 text-success",
                      unit.status === "Vacant" && "bg-destructive/10 text-destructive",
                      unit.status === "Notice" && "bg-warning/10 text-warning"
                    )}
                  >
                    {unit.status}
                  </span>
                </td>
                <td className="px-4 text-right font-mono">{formatCurrency(unit.currentRent)}</td>
                <td className="px-4 text-right font-mono">{formatCurrency(unit.marketRent)}</td>
                <td className={cn("px-4 text-right font-mono", variance > 0 ? "text-success" : "text-destructive")}>
                  {variance > 0 ? "+" : ""}{formatCurrency(variance)}
                </td>
                <td className="px-4 text-muted-foreground">{unit.leaseEnd || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
