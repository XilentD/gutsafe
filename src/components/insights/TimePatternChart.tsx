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

interface Props {
  data: Array<{ hour: number; logCount: number; avgPain: number }>;
}

export function TimePatternChart({ data }: Props) {
  const chartData = data.map((d) => ({
    time: `${d.hour}:00`,
    "日志数": d.logCount,
    "平均疼痛": d.avgPain,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={2} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="日志数" fill="#3b82f6" radius={[4, 4, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell
              key={i}
              fill={chartData[i]["平均疼痛"] > 5 ? "#ef4444" : "#3b82f6"}
              fillOpacity={0.7}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
