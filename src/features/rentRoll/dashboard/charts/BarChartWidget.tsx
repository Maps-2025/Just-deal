import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BarChartWidgetProps {
  data: any[];
  bars: { dataKey: string; fill: string; name: string }[];
  xKey: string;
  yLabel?: string;
  xLabel?: string;
  emptyMessage?: string;
  formatY?: (v: number) => string;
}

export function BarChartWidget({ data, bars, xKey, yLabel, xLabel, emptyMessage, formatY }: BarChartWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px]">
        <p className="text-sm font-semibold text-foreground">{emptyMessage || "No Data Available"}</p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            angle={-35}
            textAnchor="end"
            label={xLabel ? { value: xLabel, position: "bottom", offset: 15, fontSize: 11, fill: "hsl(var(--muted-foreground))" } : undefined}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={formatY}
            label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", offset: -5, fontSize: 11, fill: "hsl(var(--muted-foreground))" } : undefined}
          />
          <Tooltip
            contentStyle={{ fontSize: "12px", borderRadius: "6px" }}
            formatter={(value: number, name: string) => [formatY ? formatY(value) : value, name]}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
          {bars.map((b) => (
            <Bar key={b.dataKey} dataKey={b.dataKey} fill={b.fill} name={b.name} radius={[2, 2, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
