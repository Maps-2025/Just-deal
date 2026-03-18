import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import type { FloorPlanSummaryRow, ReportTypeView } from "@/services/rentRollApi";

interface FloorPlanChartsProps {
  data: FloorPlanSummaryRow[];
  reportType: ReportTypeView;
  monthlyRentMode: "0" | "1" | "2";
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
  "#6366f1", "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316",
];

function getName(row: FloorPlanSummaryRow, reportType: ReportTypeView): string {
  if (reportType === "unitsize") return `${row.avg_sqft} sf`;
  if (reportType === "floorplancode") return row.floor_plan_code || row.floor_plan;
  return row.floor_plan;
}

function getRentValue(row: FloorPlanSummaryRow, field: "market" | "in_place", mode: "0" | "1" | "2"): number {
  if (mode === "0") {
    return field === "market" ? (row.market_rent_total ?? row.avg_market_rent * row.units) : ((row.in_place_rent ?? row.avg_contract_rent) * row.occupied);
  }
  if (mode === "2") {
    const base = field === "market" ? row.avg_market_rent : (row.in_place_rent ?? row.avg_contract_rent);
    return row.avg_sqft > 0 ? base / row.avg_sqft : 0;
  }
  return field === "market" ? row.avg_market_rent : (row.in_place_rent ?? row.avg_contract_rent);
}

function fmtDollar(val: number, mode: "0" | "1" | "2"): string {
  if (mode === "2") return `$${val.toFixed(2)}`;
  return `$${Math.round(val).toLocaleString()}`;
}

const CustomTooltip = ({ active, payload, label, mode }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmtDollar(p.value, mode)}
        </p>
      ))}
      {payload.length === 2 && (
        <p className="text-muted-foreground mt-1 border-t pt-1">
          Difference: {fmtDollar(Math.abs(payload[0].value - payload[1].value), mode)}
        </p>
      )}
    </div>
  );
};

export function FloorPlanCharts({ data, reportType, monthlyRentMode }: FloorPlanChartsProps) {
  const rentChartData = useMemo(() =>
    data.slice(0, 20).map((row) => ({
      name: getName(row, reportType),
      marketRent: getRentValue(row, "market", monthlyRentMode),
      inPlaceRent: getRentValue(row, "in_place", monthlyRentMode),
    })),
    [data, reportType, monthlyRentMode]
  );

  const occupancyData = useMemo(() =>
    data.slice(0, 20).map((row) => ({
      name: getName(row, reportType),
      occupied: row.occupied,
      vacant: row.vacant,
      nonRev: row.non_rev ?? 0,
    })),
    [data, reportType]
  );

  const unitDistData = useMemo(() =>
    data.map((row) => ({
      name: getName(row, reportType),
      value: row.units,
    })),
    [data, reportType]
  );

  if (!data.length) return null;

  const needsScroll = reportType === "unitsize" && data.length > 10;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Monthly Rent Analysis</h3>

      <div className={needsScroll ? "max-h-[600px] overflow-y-auto space-y-6 pr-2" : "space-y-6"}>
        {/* Chart 1: Market vs In-Place Rent */}
        <ChartCard title="Market Rent vs In-Place Rent">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rentChartData} margin={{ top: 5, right: 20, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fmtDollar(v, monthlyRentMode)} />
              <Tooltip content={<CustomTooltip mode={monthlyRentMode} />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="marketRent" name="Market Rent" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="inPlaceRent" name="In-Place Rent" fill="hsl(var(--chart-2, 160 60% 45%))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2: Occupancy by group */}
        <ChartCard title="Occupancy Status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={occupancyData} margin={{ top: 5, right: 20, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "6px" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="occupied" name="Occupied" fill="hsl(var(--primary))" stackId="a" />
              <Bar dataKey="vacant" name="Vacant" fill="hsl(var(--chart-3, 30 80% 55%))" stackId="a" />
              <Bar dataKey="nonRev" name="Non-Rev" fill="hsl(var(--muted-foreground))" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3: Unit Distribution Pie */}
        {(reportType === "unitmix" || reportType === "floorplan") && (
          <ChartCard title="Unit Distribution">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={unitDistData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {unitDistData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "6px" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg bg-background shadow-sm p-4">
      <h4 className="text-sm font-semibold text-muted-foreground mb-3">{title}</h4>
      {children}
    </div>
  );
}
