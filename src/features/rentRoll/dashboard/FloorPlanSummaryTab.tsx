import { useMemo, useState } from "react";
import { useFloorPlanSummary } from "@/hooks/useRentRoll";
import { ChartCard } from "./charts/ChartCard";
import { BarChartWidget } from "./charts/BarChartWidget";
import { DonutChartWidget } from "./charts/DonutChartWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  DoorOpen,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid,
  BarChart3,
  Table2,
} from "lucide-react";

interface FloorPlanSummaryTabProps {
  dealId: string;
  rentRollId: string;
}

export function FloorPlanSummaryTab({ dealId, rentRollId }: FloorPlanSummaryTabProps) {
  const { data: summary = [], isLoading } = useFloorPlanSummary(dealId, rentRollId);
  const [view, setView] = useState<"dashboard" | "table">("dashboard");

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  // Aggregate KPIs
  const kpis = useMemo(() => {
    if (!summary.length) return null;
    const totalUnits = summary.reduce((s, fp) => s + fp.units, 0);
    const totalOccupied = summary.reduce((s, fp) => s + fp.occupied, 0);
    const totalVacant = summary.reduce((s, fp) => s + fp.vacant, 0);
    const occupancyPct = totalUnits > 0 ? (totalOccupied / totalUnits) * 100 : 0;
    const weightedMarket = totalUnits > 0 ? summary.reduce((s, fp) => s + fp.avg_market_rent * fp.units, 0) / totalUnits : 0;
    const weightedContract = totalUnits > 0 ? summary.reduce((s, fp) => s + fp.avg_contract_rent * fp.units, 0) / totalUnits : 0;
    const totalSqft = summary.reduce((s, fp) => s + fp.avg_sqft * fp.units, 0);
    const avgSqft = totalUnits > 0 ? Math.round(totalSqft / totalUnits) : 0;
    const lossToLease = weightedMarket - weightedContract;
    const lossToLeasePct = weightedMarket > 0 ? (lossToLease / weightedMarket) * 100 : 0;
    const floorPlanCount = summary.length;

    return { totalUnits, totalOccupied, totalVacant, occupancyPct, weightedMarket, weightedContract, avgSqft, lossToLease, lossToLeasePct, floorPlanCount };
  }, [summary]);

  // Chart data: Rent comparison by floor plan
  const rentComparisonData = useMemo(() =>
    summary.map((fp) => ({
      name: fp.floor_plan,
      "Market Rent": fp.avg_market_rent,
      "Contract Rent": fp.avg_contract_rent,
    })),
    [summary]
  );

  // Chart data: Units distribution donut
  const unitDistribution = useMemo(() =>
    summary.map((fp) => ({ name: fp.floor_plan, value: fp.units })),
    [summary]
  );

  // Chart data: Occupancy by floor plan (stacked)
  const occupancyByFP = useMemo(() =>
    summary.map((fp) => ({ name: fp.floor_plan, Occupied: fp.occupied, Vacant: fp.vacant })),
    [summary]
  );

  // Chart data: SqFt by floor plan
  const sqftData = useMemo(() =>
    summary.map((fp) => ({ name: fp.floor_plan, "Avg SqFt": fp.avg_sqft })),
    [summary]
  );

  // Chart data: Loss to lease by floor plan
  const lossToLeaseData = useMemo(() =>
    summary.map((fp) => ({
      name: fp.floor_plan,
      "Loss to Lease": Math.max(0, fp.avg_market_rent - fp.avg_contract_rent),
    })),
    [summary]
  );

  // Chart data: Occupancy rate by floor plan
  const occupancyRateData = useMemo(() =>
    summary.map((fp) => ({ name: fp.floor_plan, "Occupancy %": fp.occupancy_pct })),
    [summary]
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No Floor Plan Data</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Floor plan summary will appear here once rent roll data has been processed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Floor Plan Summary</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {kpis?.floorPlanCount} floor plans · {kpis?.totalUnits} total units
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setView("dashboard")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              view === "dashboard"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Charts
          </button>
          <button
            onClick={() => setView("table")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              view === "table"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Table2 className="h-3.5 w-3.5" />
            Table
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard
          icon={<Building2 className="h-4 w-4" />}
          label="Total Units"
          value={kpis?.totalUnits?.toLocaleString() || "0"}
          color="primary"
        />
        <KPICard
          icon={<Users className="h-4 w-4" />}
          label="Occupied"
          value={kpis?.totalOccupied?.toLocaleString() || "0"}
          sub={kpis ? fmtPct(kpis.occupancyPct) : "—"}
          color="success"
        />
        <KPICard
          icon={<DoorOpen className="h-4 w-4" />}
          label="Vacant"
          value={kpis?.totalVacant?.toLocaleString() || "0"}
          sub={kpis ? fmtPct(100 - kpis.occupancyPct) : "—"}
          color="destructive"
        />
        <KPICard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg Market Rent"
          value={kpis ? fmt(Math.round(kpis.weightedMarket)) : "$0"}
          sub={kpis ? `${kpis.avgSqft.toLocaleString()} avg sqft` : "—"}
          color="primary"
        />
        <KPICard
          icon={
            kpis && kpis.lossToLease > 0 ? (
              <ArrowDownRight className="h-4 w-4" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )
          }
          label="Loss to Lease"
          value={kpis ? fmt(Math.round(kpis.lossToLease)) : "$0"}
          sub={kpis ? fmtPct(kpis.lossToLeasePct) : "—"}
          color={kpis && kpis.lossToLease > 0 ? "warning" : "success"}
        />
      </div>

      {view === "dashboard" ? (
        <div className="space-y-6">
          {/* Row 1: Rent Comparison + Unit Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartCard title="Market vs Contract Rent by Floor Plan">
                <BarChartWidget
                  data={rentComparisonData}
                  bars={[
                    { dataKey: "Market Rent", fill: "hsl(var(--primary))", name: "Market Rent" },
                    { dataKey: "Contract Rent", fill: "hsl(var(--success))", name: "Contract Rent" },
                  ]}
                  xKey="name"
                  yLabel="$/unit"
                  formatY={(v) => `$${v.toLocaleString()}`}
                  emptyMessage="No rent data available"
                />
              </ChartCard>
            </div>
            <ChartCard title="Unit Distribution">
              <DonutChartWidget data={unitDistribution} emptyMessage="No unit data" />
            </ChartCard>
          </div>

          {/* Row 2: Occupancy by FP + Loss to Lease */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Occupancy by Floor Plan">
              <BarChartWidget
                data={occupancyByFP}
                bars={[
                  { dataKey: "Occupied", fill: "hsl(var(--success))", name: "Occupied" },
                  { dataKey: "Vacant", fill: "hsl(var(--destructive))", name: "Vacant" },
                ]}
                xKey="name"
                emptyMessage="No occupancy data"
              />
            </ChartCard>
            <ChartCard title="Loss to Lease by Floor Plan">
              <BarChartWidget
                data={lossToLeaseData}
                bars={[{ dataKey: "Loss to Lease", fill: "hsl(var(--warning))", name: "Loss to Lease" }]}
                xKey="name"
                formatY={(v) => `$${v.toLocaleString()}`}
                emptyMessage="No loss to lease data"
              />
            </ChartCard>
          </div>

          {/* Row 3: Avg SqFt + Occupancy Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Average Square Footage">
              <BarChartWidget
                data={sqftData}
                bars={[{ dataKey: "Avg SqFt", fill: "hsl(var(--primary))", name: "Avg SqFt" }]}
                xKey="name"
                yLabel="SqFt"
                emptyMessage="No sqft data"
              />
            </ChartCard>
            <ChartCard title="Occupancy Rate by Floor Plan">
              <BarChartWidget
                data={occupancyRateData}
                bars={[{ dataKey: "Occupancy %", fill: "hsl(var(--success))", name: "Occupancy %" }]}
                xKey="name"
                yLabel="%"
                formatY={(v) => `${v}%`}
                emptyMessage="No occupancy rate data"
              />
            </ChartCard>
          </div>
        </div>
      ) : (
        /* Table View */
        <FloorPlanTable summary={summary} fmt={fmt} fmtPct={fmtPct} kpis={kpis} />
      )}
    </div>
  );
}

/* ─── KPI Card ──────────────────────────────────────────────── */
function KPICard({
  icon,
  label,
  value,
  sub,
  color = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: "primary" | "success" | "destructive" | "warning";
}) {
  const colorMap = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    destructive: "text-destructive bg-destructive/10",
    warning: "text-warning bg-warning/10",
  };

  return (
    <div className="bg-background border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-lg", colorMap[color])}>
          {icon}
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground font-mono">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─── Enhanced Table ────────────────────────────────────────── */
function FloorPlanTable({
  summary,
  fmt,
  fmtPct,
  kpis,
}: {
  summary: any[];
  fmt: (n: number) => string;
  fmtPct: (n: number) => string;
  kpis: any;
}) {
  const totals = summary.reduce(
    (acc, fp) => ({
      units: acc.units + fp.units,
      occupied: acc.occupied + fp.occupied,
      vacant: acc.vacant + fp.vacant,
      sqft: acc.sqft + fp.avg_sqft * fp.units,
    }),
    { units: 0, occupied: 0, vacant: 0, sqft: 0 }
  );

  return (
    <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Floor Plan</th>
              <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Beds</th>
              <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Baths</th>
              <th className="text-right px-3 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Avg SqFt</th>
              <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Units</th>
              <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Occupied</th>
              <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Vacant</th>
              <th className="text-right px-3 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Occupancy</th>
              <th className="text-right px-3 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Avg Market</th>
              <th className="text-right px-3 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Avg Contract</th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Spread</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((fp, i) => {
              const spread = fp.avg_market_rent - fp.avg_contract_rent;
              return (
                <tr key={fp.floor_plan} className={cn("border-b hover:bg-primary/5 transition-colors", i % 2 === 0 && "bg-muted/20")}>
                  <td className="px-4 py-2.5 font-semibold text-foreground">{fp.floor_plan}</td>
                  <td className="px-3 py-2.5 text-center text-muted-foreground">{fp.bedrooms ?? "—"}</td>
                  <td className="px-3 py-2.5 text-center text-muted-foreground">{fp.bathrooms ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{fp.avg_sqft.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-center font-semibold">{fp.units}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-success font-medium">{fp.occupied}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn(fp.vacant > 0 ? "text-destructive font-medium" : "text-muted-foreground")}>{fp.vacant}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                      fp.occupancy_pct >= 95 ? "bg-success/10 text-success" :
                      fp.occupancy_pct >= 85 ? "bg-warning/10 text-warning" :
                      "bg-destructive/10 text-destructive"
                    )}>
                      {fmtPct(fp.occupancy_pct)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{fmt(fp.avg_market_rent)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{fmt(fp.avg_contract_rent)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={cn(
                      "font-mono text-xs font-medium",
                      spread > 0 ? "text-warning" : "text-success"
                    )}>
                      {spread > 0 ? "+" : ""}{fmt(Math.round(spread))}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 font-semibold bg-muted/40">
              <td className="px-4 py-3 text-foreground">Total / Weighted Avg</td>
              <td></td>
              <td></td>
              <td className="px-3 py-3 text-right font-mono">{totals.units > 0 ? Math.round(totals.sqft / totals.units).toLocaleString() : 0}</td>
              <td className="px-3 py-3 text-center">{totals.units}</td>
              <td className="px-3 py-3 text-center text-success">{totals.occupied}</td>
              <td className="px-3 py-3 text-center text-destructive">{totals.vacant}</td>
              <td className="px-3 py-3 text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  {totals.units > 0 ? fmtPct((totals.occupied / totals.units) * 100) : "0%"}
                </span>
              </td>
              <td className="px-3 py-3 text-right font-mono">{kpis ? fmt(Math.round(kpis.weightedMarket)) : "—"}</td>
              <td className="px-3 py-3 text-right font-mono">{kpis ? fmt(Math.round(kpis.weightedContract)) : "—"}</td>
              <td className="px-4 py-3 text-right font-mono text-warning">
                {kpis ? `+${fmt(Math.round(kpis.lossToLease))}` : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
