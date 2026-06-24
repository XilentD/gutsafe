"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Activity,
  BarChart3,
  Clock,
  Target,
  Shield,
  Info,
} from "lucide-react";
import { FoodCorrelationChart } from "@/components/insights/FoodCorrelationChart";
import { BristolDistribution } from "@/components/insights/BristolDistribution";
import { TimePatternChart } from "@/components/insights/TimePatternChart";
import type { GutLogInsights } from "@/types/gut-log";
import { SYMPTOM_TYPES } from "@/lib/constants";

export default function InsightsPage() {
  const [data, setData] = useState<GutLogInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch("/api/gut-logs/insights");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json.data);
    } catch {
      setError("加载洞察数据失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Loading
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl bg-muted p-4">
            <div className="mb-3 h-4 w-28 rounded bg-muted-foreground/20" />
            <div className="h-32 rounded bg-muted-foreground/10" />
          </div>
        ))}
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <p className="mt-3 text-sm text-muted-foreground">{error}</p>
        <button onClick={fetchInsights} className="mt-3 text-sm font-medium text-primary">
          🔄 重试
        </button>
      </div>
    );
  }

  // Empty — not enough data
  if (!data || data.summary.totalLogs === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <BarChart3 className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-semibold text-muted-foreground">
          暂无健康洞察
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground/70">
          记录至少10条肠道日志后，
          <br />
          系统将为你分析食物与症状的关联
        </p>
      </div>
    );
  }

  const { summary, foodCorrelations, bristolDistribution, symptomFrequency, timePatterns, topTriggers } = data;

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      <h1 className="text-lg font-bold">健康洞察</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950">
          <p className="text-xs text-blue-600 dark:text-blue-400">总记录</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {summary.totalLogs}
          </p>
        </div>
        <div className="rounded-xl bg-green-50 p-3 dark:bg-green-950">
          <p className="text-xs text-green-600 dark:text-green-400">平均疼痛</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300">
            {summary.averagePain.toFixed(1)}
          </p>
        </div>
        <div className="rounded-xl bg-purple-50 p-3 dark:bg-purple-950">
          <p className="text-xs text-purple-600 dark:text-purple-400">Bristol 均值</p>
          <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
            {summary.averageBristol.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Top Triggers */}
      {topTriggers.length > 0 && (
        <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">
              可能的Trigger Foods
            </h2>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {topTriggers.map((food) => (
              <span
                key={food}
                className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300"
              >
                {food}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-red-500">
            以上食物的症状关联度较高，建议观察
          </p>
        </div>
      )}

      {/* Food Correlation */}
      <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">食物→症状关联</h2>
        </div>
        <div className="mt-3">
          <FoodCorrelationChart data={foodCorrelations} />
        </div>
      </div>

      {/* Bristol Distribution */}
      <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Bristol 分型分布</h2>
        </div>
        <BristolDistribution data={bristolDistribution} />
      </div>

      {/* Symptom Frequency */}
      {symptomFrequency.length > 0 && (
        <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">常见症状</h2>
          </div>
          <div className="mt-3 space-y-2">
            {symptomFrequency.slice(0, 5).map((s) => {
              const st = SYMPTOM_TYPES.find((t) => t.value === s.type);
              return (
                <div key={s.type} className="flex items-center gap-3">
                  <span className="w-20 text-sm">{st?.icon} {st?.label}</span>
                  <div className="flex-1 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (s.count / symptomFrequency[0].count) * 100)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs font-medium">
                    {s.count}次
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Pattern */}
      <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">时间分布</h2>
        </div>
        <div className="mt-3">
          <TimePatternChart data={timePatterns} />
        </div>
      </div>

      {/* Info footer */}
      <div className="flex items-start gap-2 rounded-xl bg-muted/30 p-3">
        <Info className="mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">
          基于{summary.totalLogs}条日志 · {new Date(summary.dateRange.from).toLocaleDateString("zh-CN")} 至{" "}
          {new Date(summary.dateRange.to).toLocaleDateString("zh-CN")}
          · 数据仅存储在本地，不会分享给第三方
        </p>
      </div>
    </div>
  );
}
