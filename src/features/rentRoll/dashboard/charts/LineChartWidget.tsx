import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LineChartWidgetProps {
  data: any[];
  lines: { dataKey: string; stroke: string; name: string }[];
  xKey: string;
  emptyMessage?: string;
}

export function LineChartWidget({ data, lines, xKey, emptyMessage }: LineChartWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px]">
        <p className="text-sm font-semibold text-foreground">{emptyMessage || "No Data Available"}</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "6px" }} />
        {lines.map((l) => (
          <Line key={l.dataKey} type="monotone" dataKey={l.dataKey} stroke={l.stroke} name={l.name} strokeWidth={2} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
