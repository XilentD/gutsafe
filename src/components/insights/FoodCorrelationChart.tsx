"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface FoodCorrelation {
  foodName: string;
  correlationScore: number;
  avgPain: number;
  logCount: number;
}

interface Props {
  data: FoodCorrelation[];
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

export function FoodCorrelationChart({ data }: Props) {
  const top10 = data.slice(0, 10);

  if (top10.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        数据不足，需要更多日志
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, top10.length * 30)}>
      <BarChart data={top10} layout="vertical" margin={{ left: 80, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} />
        <YAxis
          dataKey="foodName"
          type="category"
          tick={{ fontSize: 11 }}
          width={80}
        />
        <Tooltip
          formatter={(value: number) => [`${Math.round(value * 100)}%`, "关联度"]}
          labelFormatter={(label) => `食物: ${label}`}
        />
        <Bar dataKey="correlationScore" radius={[0, 4, 4, 0]}>
          {top10.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
