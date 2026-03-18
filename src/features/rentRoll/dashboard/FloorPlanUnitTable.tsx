import { cn } from "@/lib/utils";
import type { FloorPlanSummaryRow } from "@/services/rentRollApi";

interface FloorPlanUnitTableProps {
  data: FloorPlanSummaryRow[];
  totals: FloorPlanSummaryRow | null;
}

/**
 * Bottom table: Unit Information + Occupancy Status (# Units) + Occupancy Status (%)
 */
export function FloorPlanUnitTable({ data, totals }: FloorPlanUnitTableProps) {
  const totalUnits = totals?.units ?? data.reduce((s, r) => s + r.units, 0);

  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          {/* Multi-level header */}
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-center px-3 py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground border-r" colSpan={6}>
                Unit Information
              </th>
              <th className="text-center px-3 py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground border-r" colSpan={3}>
                Occupancy Status (# Units)
              </th>
              <th className="text-center px-3 py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground" colSpan={3}>
                Occupancy Status (%)
              </th>
            </tr>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-3 py-2 font-semibold text-xs text-muted-foreground w-[160px]">Floor Plan</th>
              <th className="text-center px-3 py-2 font-semibold text-xs text-muted-foreground">Bedrooms</th>
              <th className="text-center px-3 py-2 font-semibold text-xs text-muted-foreground">Baths</th>
              <th className="text-right px-3 py-2 font-semibold text-xs text-muted-foreground">Net sf</th>
              <th className="text-center px-3 py-2 font-semibold text-xs text-muted-foreground"># Units</th>
              <th className="text-right px-3 py-2 font-semibold text-xs text-primary border-r">%</th>
              <th className="text-center px-3 py-2 font-semibold text-xs text-muted-foreground">Occupied</th>
              <th className="text-center px-3 py-2 font-semibold text-xs text-muted-foreground">Vacant</th>
              <th className="text-center px-3 py-2 font-semibold text-xs text-muted-foreground border-r">Non-Rev</th>
              <th className="text-right px-3 py-2 font-semibold text-xs text-primary">Occupied</th>
              <th className="text-right px-3 py-2 font-semibold text-xs text-muted-foreground">Vacant</th>
              <th className="text-right px-3 py-2 font-semibold text-xs text-muted-foreground">Non-Rev</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const unitPct = totalUnits > 0 ? (row.units / totalUnits) * 100 : 0;
              const occPct = row.units > 0 ? (row.occupied / row.units) * 100 : 0;
              const vacPct = row.units > 0 ? (row.vacant / row.units) * 100 : 0;
              const nonRev = row.non_rev ?? 0;
              const nonRevPct = row.units > 0 ? (nonRev / row.units) * 100 : 0;

              return (
                <tr key={row.floor_plan} className={cn("border-b hover:bg-muted/20 transition-colors", i % 2 === 0 && "bg-background")}>
                  <td className="px-3 py-2.5 text-foreground">{row.floor_plan}</td>
                  <td className="px-3 py-2.5 text-center text-foreground">{row.bedrooms ?? "—"}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn(row.bathrooms === 1 ? "text-primary font-medium" : "text-foreground")}>
                      {row.bathrooms ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-foreground">{row.avg_sqft.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn(row.units > 10 ? "text-primary font-medium" : "text-foreground")}>
                      {row.units}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-primary border-r">{fmtPct(unitPct)}</td>
                  <td className="px-3 py-2.5 text-center text-foreground">{row.occupied}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn(row.vacant > 0 ? "text-primary font-medium" : "text-foreground")}>
                      {row.vacant}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-foreground border-r">{nonRev}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-foreground">{fmtPct(occPct)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-foreground">{fmtPct(vacPct)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-foreground">{fmtPct(nonRevPct)}</td>
                </tr>
              );
            })}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="border-t-2 bg-muted/40 font-semibold">
                <td className="px-3 py-2.5 text-foreground">Total / Average</td>
                <td className="px-3 py-2.5"></td>
                <td className="px-3 py-2.5"></td>
                <td className="px-3 py-2.5 text-right font-mono text-foreground">{totals.avg_sqft.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-center font-bold text-foreground">{totals.units}</td>
                <td className="px-3 py-2.5 text-right font-mono text-primary font-bold border-r">100.0%</td>
                <td className="px-3 py-2.5 text-center text-foreground font-bold">{totals.occupied}</td>
                <td className="px-3 py-2.5 text-center text-foreground font-bold">{totals.vacant}</td>
                <td className="px-3 py-2.5 text-center text-foreground font-bold border-r">{totals.non_rev ?? 0}</td>
                <td className="px-3 py-2.5 text-right font-mono text-primary font-bold">
                  {totals.units > 0 ? fmtPct((totals.occupied / totals.units) * 100) : "0.0%"}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-foreground font-bold">
                  {totals.units > 0 ? fmtPct((totals.vacant / totals.units) * 100) : "0.0%"}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-foreground font-bold">
                  {totals.units > 0 ? fmtPct(((totals.non_rev ?? 0) / totals.units) * 100) : "0.0%"}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
