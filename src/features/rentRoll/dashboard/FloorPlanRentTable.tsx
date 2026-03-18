import { cn } from "@/lib/utils";
import type { FloorPlanSummaryRow, ReportTypeView } from "@/services/rentRollApi";

interface FloorPlanRentTableProps {
  data: FloorPlanSummaryRow[];
  totals: FloorPlanSummaryRow | null;
  monthlyRentMode: "0" | "1" | "2";
  reportType: ReportTypeView;
}

const LABEL_MAP: Record<ReportTypeView, string> = {
  floorplan: "Floor Plan",
  unitmix: "Unit Type",
  unitsize: "Unit Size",
  floorplancode: "Code",
};

export function FloorPlanRentTable({ data, totals, monthlyRentMode, reportType }: FloorPlanRentTableProps) {
  const showCodeCol = reportType === "floorplancode";
  const firstColLabel = LABEL_MAP[reportType];
  const unitInfoColSpan = showCodeCol ? 3 : 2;

  const fmt = (row: FloorPlanSummaryRow, field: "market" | "occupied_market" | "in_place") => {
    let val: number;
    if (monthlyRentMode === "0") {
      if (field === "market") val = row.market_rent_total ?? row.avg_market_rent * row.units;
      else if (field === "occupied_market") val = (row.occupied_market_rent ?? row.avg_market_rent) * row.occupied;
      else val = (row.in_place_rent ?? row.avg_contract_rent) * row.occupied;
    } else if (monthlyRentMode === "2") {
      if (field === "market") val = row.market_rent_psf ?? (row.avg_sqft > 0 ? row.avg_market_rent / row.avg_sqft : 0);
      else if (field === "occupied_market") val = row.avg_sqft > 0 ? (row.occupied_market_rent ?? row.avg_market_rent) / row.avg_sqft : 0;
      else val = row.avg_sqft > 0 ? (row.in_place_rent ?? row.avg_contract_rent) / row.avg_sqft : 0;
    } else {
      if (field === "market") val = row.avg_market_rent;
      else if (field === "occupied_market") val = row.occupied_market_rent ?? row.avg_market_rent;
      else val = row.in_place_rent ?? row.avg_contract_rent;
    }
    return formatDollar(val, monthlyRentMode);
  };

  const pctOfMarket = (row: FloorPlanSummaryRow) => {
    const inPlace = row.in_place_rent ?? row.avg_contract_rent;
    const occMarket = row.occupied_market_rent ?? row.avg_market_rent;
    if (occMarket === 0) return "—";
    return `${((inPlace / occMarket) * 100).toFixed(1)}%`;
  };

  const displayName = (row: FloorPlanSummaryRow) => {
    if (reportType === "unitsize") return `${row.avg_sqft.toLocaleString()} sf`;
    return row.floor_plan;
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-center px-4 py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground border-r" colSpan={unitInfoColSpan}>
                Unit Information
              </th>
              <th className="text-center px-4 py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground border-r">
                All Units
              </th>
              <th className="text-center px-4 py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground" colSpan={3}>
                Currently Occupied Units
              </th>
            </tr>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-2 font-semibold text-xs text-muted-foreground w-[180px]">{firstColLabel}</th>
              {showCodeCol && (
                <th className="text-left px-4 py-2 font-semibold text-xs text-muted-foreground w-[140px]">Floor Plan</th>
              )}
              <th className="border-r w-0" />
              <th className="text-right px-4 py-2 font-semibold text-xs text-muted-foreground border-r">Market Rent</th>
              <th className="text-right px-4 py-2 font-semibold text-xs text-muted-foreground">Market Rent</th>
              <th className="text-right px-4 py-2 font-semibold text-xs text-primary">In-Place Rent</th>
              <th className="text-right px-4 py-2 font-semibold text-xs text-muted-foreground">% of Market Rent</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={`${row.floor_plan}-${i}`} className={cn("border-b hover:bg-muted/20 transition-colors", i % 2 === 0 && "bg-background")}>
                <td className="px-4 py-2.5 text-foreground">{displayName(row)}</td>
                {showCodeCol && (
                  <td className="px-4 py-2.5 text-foreground">{row.floor_plan}</td>
                )}
                <td className="border-r w-0" />
                <td className="px-4 py-2.5 text-right font-mono text-foreground border-r">{fmt(row, "market")}</td>
                <td className="px-4 py-2.5 text-right font-mono text-foreground">{fmt(row, "occupied_market")}</td>
                <td className="px-4 py-2.5 text-right font-mono text-primary">{fmt(row, "in_place")}</td>
                <td className="px-4 py-2.5 text-right font-mono text-foreground">{pctOfMarket(row)}</td>
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="border-t-2 bg-muted/40 font-semibold">
                <td className="px-4 py-2.5 text-foreground" colSpan={showCodeCol ? 2 : 1}>Total / Average</td>
                <td className="border-r w-0" />
                <td className="px-4 py-2.5 text-right font-mono text-foreground font-bold border-r">{fmt(totals, "market")}</td>
                <td className="px-4 py-2.5 text-right font-mono text-foreground font-bold">{fmt(totals, "occupied_market")}</td>
                <td className="px-4 py-2.5 text-right font-mono text-primary font-bold">{fmt(totals, "in_place")}</td>
                <td className="px-4 py-2.5 text-right font-mono text-primary font-bold">{pctOfMarket(totals)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function formatDollar(val: number, mode: "0" | "1" | "2"): string {
  if (mode === "2") {
    return `$ ${val.toFixed(2)}`;
  }
  return `$ ${Math.round(val).toLocaleString()}`;
}
