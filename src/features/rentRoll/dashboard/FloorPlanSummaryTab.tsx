import { useFloorPlanSummary } from "@/hooks/useRentRoll";

export function FloorPlanSummaryTab({ dealId, rentRollId }: { dealId: string; rentRollId: string }) {
  const { data: summary = [], isLoading } = useFloorPlanSummary(dealId, rentRollId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  const totals = summary.reduce((acc, fp) => ({ units: acc.units + fp.units, occupied: acc.occupied + fp.occupied, vacant: acc.vacant + fp.vacant, sqft: acc.sqft + fp.avg_sqft * fp.units }), { units: 0, occupied: 0, vacant: 0, sqft: 0 });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Floor Plan Summary</h3>
      <div className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-left px-3 py-2 font-medium">Floor Plan</th>
            <th className="text-center px-3 py-2 font-medium">Beds</th>
            <th className="text-center px-3 py-2 font-medium">Baths</th>
            <th className="text-right px-3 py-2 font-medium">Avg SqFt</th>
            <th className="text-center px-3 py-2 font-medium"># Units</th>
            <th className="text-center px-3 py-2 font-medium">Occupied</th>
            <th className="text-center px-3 py-2 font-medium">Vacant</th>
            <th className="text-right px-3 py-2 font-medium">Occupancy</th>
            <th className="text-right px-3 py-2 font-medium">Avg Market</th>
            <th className="text-right px-3 py-2 font-medium">Avg Contract</th>
          </tr></thead>
          <tbody>
            {summary.map((fp) => (
              <tr key={fp.floor_plan} className="border-b hover:bg-muted/30">
                <td className="px-3 py-2 font-mono">{fp.floor_plan}</td>
                <td className="px-3 py-2 text-center">{fp.bedrooms ?? "—"}</td>
                <td className="px-3 py-2 text-center">{fp.bathrooms ?? "—"}</td>
                <td className="px-3 py-2 text-right font-mono">{fp.avg_sqft.toLocaleString()}</td>
                <td className="px-3 py-2 text-center">{fp.units}</td>
                <td className="px-3 py-2 text-center">{fp.occupied}</td>
                <td className="px-3 py-2 text-center">{fp.vacant}</td>
                <td className="px-3 py-2 text-right">{fp.occupancy_pct}%</td>
                <td className="px-3 py-2 text-right font-mono">{fmt(fp.avg_market_rent)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmt(fp.avg_contract_rent)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="border-t-2 font-semibold bg-muted/30">
            <td className="px-3 py-2">Total</td><td></td><td></td>
            <td className="px-3 py-2 text-right font-mono">{totals.units > 0 ? Math.round(totals.sqft / totals.units).toLocaleString() : 0}</td>
            <td className="px-3 py-2 text-center">{totals.units}</td>
            <td className="px-3 py-2 text-center">{totals.occupied}</td>
            <td className="px-3 py-2 text-center">{totals.vacant}</td>
            <td className="px-3 py-2 text-right">{totals.units > 0 ? Math.round((totals.occupied / totals.units) * 1000) / 10 : 0}%</td>
            <td></td><td></td>
          </tr></tfoot>
        </table>
      </div>
    </div>
  );
}
