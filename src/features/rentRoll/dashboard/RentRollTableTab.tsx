import { cn } from "@/lib/utils";
import { useRentRollUnitsDetailed } from "@/hooks/useRentRoll";

export function RentRollTableTab({ dealId, rentRollId }: { dealId: string; rentRollId: string }) {
  const { data: units = [], isLoading } = useRentRollUnitsDetailed(dealId, rentRollId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const fmt = (n: number | null) => n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n) : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Rent Roll</h3>
        <p className="text-sm text-muted-foreground">{units.length} units</p>
      </div>
      <div className="overflow-auto max-h-[600px]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm"><tr className="border-b">
            <th className="text-left px-3 py-2 font-medium">Unit No</th>
            <th className="text-left px-3 py-2 font-medium">Floor Plan</th>
            <th className="text-right px-3 py-2 font-medium">Beds</th>
            <th className="text-left px-3 py-2 font-medium">Unit Type</th>
            <th className="text-left px-3 py-2 font-medium">Lease Type</th>
            <th className="text-left px-3 py-2 font-medium">Renovation</th>
            <th className="text-left px-3 py-2 font-medium">Occupancy</th>
            <th className="text-right px-3 py-2 font-medium">Market Rent</th>
            <th className="text-right px-3 py-2 font-medium">Contract Rent</th>
          </tr></thead>
          <tbody>
            {units.map((u, i) => (
              <tr key={u.id} className={cn("border-b hover:bg-primary/5", i % 2 === 0 && "bg-muted/20")}>
                <td className="px-3 py-1.5 font-mono">{u.unit_no || "—"}</td>
                <td className="px-3 py-1.5">{u.floor_plan || "—"}</td>
                <td className="px-3 py-1.5 text-right">{u.bedrooms ?? "—"}</td>
                <td className="px-3 py-1.5">{u.unit_type || "—"}</td>
                <td className="px-3 py-1.5">{u.lease_type || "Market"}</td>
                <td className="px-3 py-1.5">{u.renovation_status || "Unrenovated"}</td>
                <td className="px-3 py-1.5"><span className={cn("text-xs font-medium px-2 py-0.5 rounded-sm", u.occupancy_status?.toLowerCase() === "occupied" && "bg-success/10 text-success", u.occupancy_status?.toLowerCase() === "vacant" && "bg-destructive/10 text-destructive")}>{u.occupancy_status || "—"}</span></td>
                <td className="px-3 py-1.5 text-right font-mono">{fmt(u.market_rent)}</td>
                <td className="px-3 py-1.5 text-right font-mono">{fmt(u.contractual_rent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
