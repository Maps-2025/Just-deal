import { useState } from "react";
import { useRentRollDashboard, useRentRollList } from "@/hooks/useRentRoll";
import { ReportSettingsPanel } from "./ReportSettingsPanel";
import { ChartCard } from "./charts/ChartCard";
import { DonutChartWidget } from "./charts/DonutChartWidget";
import { BarChartWidget } from "./charts/BarChartWidget";
import { LineChartWidget } from "./charts/LineChartWidget";
import { Skeleton } from "@/components/ui/skeleton";

interface RentRollDashboardProps {
  dealId: string;
  rentRollId: string;
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

export function RentRollDashboard({ dealId, rentRollId, onBack, onNavigate }: RentRollDashboardProps) {
  const [selectedRRId, setSelectedRRId] = useState(rentRollId);
  const { data: rentRolls = [] } = useRentRollList(dealId);
  const { data: dashboard, isLoading } = useRentRollDashboard(dealId, selectedRRId);

  const selectedRR = rentRolls.find((r) => r.id === selectedRRId);

  // Build chart data from dashboard response
  const monthlyRentData = dashboard?.unit_types?.map((ut) => ({
    name: ut.name,
    "In-Place": 0,
    Market: 0,
  })) || [];

  const occupancyData = dashboard
    ? [
        { name: "All Units", Occupied: dashboard.occupied || 0, Vacant: (dashboard.total_units || 0) - (dashboard.occupied || 0) },
      ]
    : [];

  const fmtDollar = (v: number) => `$${v.toLocaleString()}`;
  const fmtPct = (v: number) => `${v}%`;

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
      />

      {/* Right Panel — Scrollable Dashboard */}
      <div className="flex-1 overflow-y-auto bg-muted/30">
        <div className="p-6">
          <h2 className="text-xl font-normal text-foreground text-center mb-6">Rent Roll Dashboard</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[280px] rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Row 1: 3 donut charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ChartCard title="Unit Types">
                  <DonutChartWidget data={dashboard?.unit_types || []} emptyMessage="No Data Available For Unit Types" />
                </ChartCard>
                <ChartCard title="Lease Types">
                  <DonutChartWidget data={dashboard?.lease_types || []} emptyMessage="No Data Available For Lease Types" />
                </ChartCard>
                <ChartCard title="Renovation Status">
                  <DonutChartWidget data={dashboard?.renovation_status || []} emptyMessage="No Data Available For Renovation Status" />
                </ChartCard>
              </div>

              {/* Row 2: Leasing Trends */}
              <div className="grid grid-cols-1 gap-6">
                <ChartCard title="Leasing Trends">
                  <LineChartWidget
                    data={[]}
                    lines={[{ dataKey: "leases", stroke: "hsl(207, 57%, 41%)", name: "Leases Signed" }]}
                    xKey="month"
                    emptyMessage="No Data Available For Leasing Trends"
                  />
                </ChartCard>
              </div>

              {/* Row 3: Loss to Lease Burn-off */}
              <div className="grid grid-cols-1 gap-6">
                <ChartCard title="Loss to Lease Burn-off">
                  <BarChartWidget
                    data={[]}
                    bars={[{ dataKey: "loss", fill: "hsl(207, 57%, 41%)", name: "Loss to Lease" }]}
                    xKey="month"
                    emptyMessage="No Data Available For Loss to Lease Burn-off"
                  />
                </ChartCard>
              </div>

              {/* Row 4: Lease Expiration Schedule */}
              <div className="grid grid-cols-1 gap-6">
                <ChartCard title="Lease Expiration Schedule">
                  <BarChartWidget
                    data={[]}
                    bars={[{ dataKey: "units", fill: "hsl(207, 57%, 41%)", name: "Units Expiring" }]}
                    xKey="month"
                    emptyMessage="No Data Available For Lease Expiration Schedule"
                  />
                </ChartCard>
              </div>

              {/* Row 5: Monthly Rents + Occupancy Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChartCard title="Monthly Rents">
                  <BarChartWidget
                    data={monthlyRentData}
                    bars={[
                      { dataKey: "In-Place", fill: "hsl(207, 57%, 41%)", name: "In-Place" },
                      { dataKey: "Market", fill: "hsl(207, 57%, 70%)", name: "Market" },
                    ]}
                    xKey="name"
                    yLabel="$ per unit"
                    xLabel="Unit Type"
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
                    yLabel="% of Units"
                    xLabel="Unit Type"
                    emptyMessage="No Data Available For Occupancy Status"
                  />
                </ChartCard>
              </div>

              {/* Row 6: In-Place Rent by Renovation Status + Renovation Premium */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChartCard title="In-Place Rent by Renovation Status">
                  <BarChartWidget
                    data={[]}
                    bars={[{ dataKey: "rent", fill: "hsl(207, 57%, 41%)", name: "In-Place Rent" }]}
                    xKey="status"
                    emptyMessage="No Data Available For In-Place Rent by Renovation Status"
                  />
                </ChartCard>
                <ChartCard title="Renovation Premium">
                  <BarChartWidget
                    data={[]}
                    bars={[{ dataKey: "premium", fill: "hsl(207, 57%, 41%)", name: "Premium" }]}
                    xKey="type"
                    emptyMessage="No Data Available For Renovation Premium"
                  />
                </ChartCard>
              </div>

              {/* Row 7: Lease Type + Renovation Status bar charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChartCard title="Lease Type">
                  <BarChartWidget
                    data={[]}
                    bars={[{ dataKey: "count", fill: "hsl(207, 57%, 41%)", name: "Units" }]}
                    xKey="type"
                    emptyMessage="No Data Available For Lease Type"
                  />
                </ChartCard>
                <ChartCard title="Renovation Status">
                  <BarChartWidget
                    data={[]}
                    bars={[{ dataKey: "count", fill: "hsl(207, 57%, 41%)", name: "Units" }]}
                    xKey="status"
                    emptyMessage="No Data Available For Renovation Status"
                  />
                </ChartCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
