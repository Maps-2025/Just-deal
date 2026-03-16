import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ["hsl(207, 57%, 41%)", "hsl(142, 50%, 45%)", "hsl(38, 80%, 50%)", "hsl(0, 65%, 55%)", "hsl(280, 50%, 50%)"];

interface DonutChartWidgetProps {
  data: { name: string; value: number }[];
  emptyMessage?: string;
}

export function DonutChartWidget({ data, emptyMessage }: DonutChartWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px]">
        <p className="text-sm font-semibold text-foreground">{emptyMessage || "No Data Available"}</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      {/* Legend at top */}
      <div className="flex items-center justify-center gap-4 mb-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-foreground">{d.name}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value} units`, ""]}
            contentStyle={{ fontSize: "12px", borderRadius: "6px" }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Percentage label */}
      <div className="flex items-center justify-center gap-4 mt-1">
        {data.map((d, i) => (
          <span key={d.name} className="text-xs font-medium" style={{ color: COLORS[i % COLORS.length] }}>
            {total > 0 ? Math.round((d.value / total) * 100) : 0}%
          </span>
        ))}
      </div>
    </div>
  );
}
