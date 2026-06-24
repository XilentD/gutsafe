"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BRISTOL_SCALE } from "@/lib/constants";

interface Props {
  data: Array<{ score: number; count: number; percentage: number }>;
}

const COLORS = [
  "#8B4513", "#CD853F", "#DAA520", "#22c55e", "#60a5fa", "#eab308", "#ef4444",
];

export function BristolDistribution({ data }: Props) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: `Type ${d.score}`,
      value: d.count,
      label: BRISTOL_SCALE[d.score - 1]?.label || "",
      percentage: d.percentage,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          dataKey="value"
          label={({ name, percentage }) => `${name} ${percentage}%`}
          labelLine={{ strokeWidth: 1 }}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value}次`, ""]}
          labelFormatter={(i) => {
            const item = chartData[i];
            return item ? `${item.name} — ${item.label}` : "";
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
