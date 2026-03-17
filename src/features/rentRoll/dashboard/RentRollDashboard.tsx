import { useState, useMemo } from "react";
import { useRentRollDashboard, useRentRollList } from "@/hooks/useRentRoll";
import { ReportSettingsPanel } from "./ReportSettingsPanel";
import { ChartCard } from "./charts/ChartCard";
import { DonutChartWidget } from "./charts/DonutChartWidget";
import { BarChartWidget } from "./charts/BarChartWidget";
import { LineChartWidget } from "./charts/LineChartWidget";
import { KPISummaryRow } from "./KPISummaryRow";
import { AnomalyPanel } from "./AnomalyPanel";
import { Skeleton } from "@/components/ui/skeleton";

interface RentRollDashboardProps {
  dealId: string;
  rentRollId: string;
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

export function RentRollDashboard({ dealId, rentRollId, onBack, onNavigate }: RentRollDashboardProps) {
  const [selectedRRId, setSelectedRRId] = useState(rentRollId);
  const [monthlyRentMode, setMonthlyRentMode] = useState("per_unit");
  const [inPlaceRentType, setInPlaceRentType] = useState("contractual");
  const [leaseExpBy, setLeaseExpBy] = useState("units");
  const [leaseExpShown, setLeaseExpShown] = useState("by_bed");
  const [detailFilters, setDetailFilters] = useState<string[]>([]);
  const [showAnomalies, setShowAnomalies] = useState(false);

  const { data: rentRolls = [] } = useRentRollList(dealId);
  const { data: dashboard, isLoading } = useRentRollDashboard(dealId, selectedRRId);

  const selectedRR = rentRolls.find((r) => r.id === selectedRRId);
  const settings = dashboard?.settings;

  // Monthly rent data adapted to selected mode
  const monthlyRentData = useMemo(() => {
    if (!dashboard?.monthly_rent?.length) return [];
    return dashboard.monthly_rent.map((mr) => ({
      name: mr.floor_plan,
      "In-Place": monthlyRentMode === "per_unit" ? mr.in_place
        : monthlyRentMode === "total" ? mr.in_place_total
        : mr.in_place_psf,
      Market: monthlyRentMode === "per_unit" ? mr.market
        : monthlyRentMode === "total" ? mr.market_total
        : mr.market_psf,
    }));
  }, [dashboard?.monthly_rent, monthlyRentMode]);

  // Lease expiry data adapted to selected mode
  const leaseExpiryData = useMemo(() => {
    if (!dashboard?.lease_expiration?.length) return [];
    return dashboard.lease_expiration.map((le) => ({
      month: le.month,
      value: leaseExpBy === "units" ? le.count
        : leaseExpBy === "pct_units" ? le.pct_units
        : le.pct_rent,
    }));
  }, [dashboard?.lease_expiration, leaseExpBy]);

  // Occupancy bar data
  const occupancyData = dashboard
    ? [{ name: "All Units", Occupied: dashboard.occupied || 0, Vacant: dashboard.vacant || 0 }]
    : [];

  const fmtDollar = (v: number) => `$${v.toLocaleString()}`;

  // Anomalies from frontend detection (fallback if API not ready)
  const anomalies = useMemo(() => {
    if (!dashboard) return [];
    const items: { unitNo: string; issue: string }[] = [];
    // These come from backend anomalies API ideally
    return items;
  }, [dashboard]);

  return (
    <div className="flex flex-1 min-h-0">
      {/* Left Panel — Report Settings */}
      <ReportSettingsPanel
        rentRolls={rentRolls}
        selectedRentRollId={selectedRRId}
        onSelectRentRoll={setSelectedRRId}
        onManage={() => onNavigate?.("rent-roll-manage")}
        onView={() => onNavigate?.("rent-roll-table")}
        hasAnomalies={selectedRR?.has_anomalies}
        onAnomaliesClick={() => setShowAnomalies(!showAnomalies)}
        monthlyRentMode={monthlyRentMode}
        onMonthlyRentModeChange={setMonthlyRentMode}
        inPlaceRentType={inPlaceRentType}
        onInPlaceRentTypeChange={setInPlaceRentType}
        leaseExpBy={leaseExpBy}
        onLeaseExpByChange={setLeaseExpBy}
        leaseExpShown={leaseExpShown}
        onLeaseExpShownChange={setLeaseExpShown}
        detailFilters={detailFilters}
        onDetailFiltersChange={setDetailFilters}
      />

      {/* Right Panel — Scrollable Dashboard */}
      <div className="flex-1 overflow-y-auto bg-muted/20">
        <div className="p-6">
          <h2 className="text-xl font-normal text-foreground text-center mb-6">Rent Roll Dashboard</h2>

          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[80px] rounded-lg" />
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[300px] rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPI Summary Row */}
              {dashboard && (
                <KPISummaryRow
                  totalUnits={dashboard.total_units}
                  occupied={dashboard.occupied}
                  vacant={dashboard.vacant}
                  occupancyPct={dashboard.occupancy_pct}
                  avgMarketRent={dashboard.avg_market_rent}
                  avgInPlaceRent={dashboard.avg_in_place_rent}
                  totalMonthlyRent={dashboard.total_monthly_rent}
                  lossToLease={dashboard.loss_to_lease}
                  lossToLeasePct={dashboard.loss_to_lease_pct}
                  vacancyLoss={dashboard.vacancy_loss}
                />
              )}

              {/* Anomaly Panel */}
              {showAnomalies && (
                <AnomalyPanel
                  anomalies={anomalies}
                  onClose={() => setShowAnomalies(false)}
                />
              )}

              {/* Row 1: 3 donut charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ChartCard title="Unit Types">
                  <DonutChartWidget data={dashboard?.unit_types || []} emptyMessage="No Data Available For Unit Types" />
                </ChartCard>
                {(settings?.hasLeaseTypes !== false) && (
                  <ChartCard title="Lease Types">
                    <DonutChartWidget data={dashboard?.lease_types || []} emptyMessage="No Data Available For Lease Types" />
                  </ChartCard>
                )}
                {(settings?.hasRenovations !== false) && (
                  <ChartCard title="Renovation Status">
                    <DonutChartWidget data={dashboard?.renovation_status || []} emptyMessage="No Data Available For Renovation Status" />
                  </ChartCard>
                )}
              </div>

              {/* Row 2: Monthly Rents + Occupancy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChartCard title="Monthly Rents">
                  <BarChartWidget
                    data={monthlyRentData}
                    bars={[
                      { dataKey: "In-Place", fill: "hsl(207, 57%, 41%)", name: "In-Place" },
                      { dataKey: "Market", fill: "hsl(207, 57%, 70%)", name: "Market" },
                    ]}
                    xKey="name"
                    yLabel={monthlyRentMode === "per_unit" ? "$ per unit" : monthlyRentMode === "total" ? "$ total" : "$ per sf"}
                    formatY={fmtDollar}
                    emptyMessage="No Data Available For Monthly Rents"
                  />
                </ChartCard>
                <ChartCard title="Occupancy Status">
                  <BarChartWidget
                    data={occupancyData}
                    bars={[
                      { dataKey: "Occupied", fill: "hsl(207, 57%, 41%)", name: "Occupied" },
                      { dataKey: "Vacant", fill: "hsl(207, 57%, 70%)", name: "Vacant" },
                    ]}
                    xKey="name"
                    emptyMessage="No Data Available For Occupancy Status"
                  />
                </ChartCard>
              </div>

              {/* Row 3: Lease Expiration */}
              {(settings?.hasLeaseDates !== false) && (
                <div className="grid grid-cols-1 gap-6">
                  <ChartCard title="Lease Expiration Schedule">
                    <BarChartWidget
                      data={leaseExpiryData}
                      bars={[{
                        dataKey: "value",
                        fill: "hsl(207, 57%, 41%)",
                        name: leaseExpBy === "units" ? "Units Expiring" : leaseExpBy === "pct_units" ? "% of Units" : "% of Rent"
                      }]}
                      xKey="month"
                      emptyMessage="No Data Available For Lease Expiration Schedule"
                    />
                  </ChartCard>
                </div>
              )}

              {/* Row 4: Leasing Trends */}
              {(settings?.hasLeaseSignDate) && (
                <div className="grid grid-cols-1 gap-6">
                  <ChartCard title="Leasing Trends">
                    <LineChartWidget
                      data={dashboard?.leasing_trends || []}
                      lines={[{ dataKey: "leases", stroke: "hsl(207, 57%, 41%)", name: "Leases Signed" }]}
                      xKey="month"
                      emptyMessage="No Data Available For Leasing Trends"
                    />
                  </ChartCard>
                </div>
              )}

              {/* Row 5: Loss to Lease Burn-off */}
              <div className="grid grid-cols-1 gap-6">
                <ChartCard title="Loss to Lease">
                  <BarChartWidget
                    data={dashboard?.loss_to_lease_by_fp || []}
                    bars={[{ dataKey: "loss", fill: "hsl(207, 57%, 41%)", name: "Loss to Lease" }]}
                    xKey="name"
                    formatY={fmtDollar}
                    emptyMessage="No Data Available For Loss to Lease"
                  />
                </ChartCard>
              </div>

              {/* Row 6: Renovation charts */}
              {(settings?.hasRenovations !== false) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChartCard title="In-Place Rent by Renovation Status">
                    <BarChartWidget
                      data={dashboard?.rent_by_renovation || []}
                      bars={[{ dataKey: "rent", fill: "hsl(207, 57%, 41%)", name: "Avg In-Place Rent" }]}
                      xKey="status"
                      formatY={fmtDollar}
                      emptyMessage="No Data Available For In-Place Rent by Renovation Status"
                    />
                  </ChartCard>
                  <ChartCard title="Renovation Premium">
                    <BarChartWidget
                      data={dashboard?.renovation_premium || []}
                      bars={[{ dataKey: "avg_rent", fill: "hsl(207, 57%, 41%)", name: "Avg Rent" }]}
                      xKey="status"
                      formatY={fmtDollar}
                      emptyMessage="No Data Available For Renovation Premium"
                    />
                  </ChartCard>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
