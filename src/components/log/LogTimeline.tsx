"use client";

import Link from "next/link";
import { BRISTOL_SCALE, SYMPTOM_TYPES } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import type { GutLogSummary } from "@/types/gut-log";
import { cn } from "@/lib/utils";

interface LogTimelineProps {
  logs: GutLogSummary[];
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function LogTimeline({ logs, hasMore, onLoadMore }: LogTimelineProps) {
  // Group logs by date
  const groups: Record<string, GutLogSummary[]> = {};
  logs.forEach((log) => {
    const date = new Date(log.loggedAt).toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
  });

  return (
    <div className="p-4">
      {Object.entries(groups).map(([date, dayLogs]) => (
        <div key={date} className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            {date}
          </h3>
          <div className="space-y-3">
            {dayLogs.map((log) => {
              const bristol = BRISTOL_SCALE.find(
                (b) => b.score === log.bristolScore
              );
              const painUrgencyLabel =
                log.painLevel > 0
                  ? `😣 ${log.painLevel}/10`
                  : "😊 无痛";
              const urgencyEmoji =
                log.urgencyLevel >= 8
                  ? "🔴"
                  : log.urgencyLevel >= 5
                    ? "🟡"
                    : "🟢";

              return (
                <Link
                  key={log.id}
                  href={`/log/${log.id}`}
                  className="block rounded-xl bg-card p-4 shadow-sm ring-1 ring-border transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Bristol icon */}
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-lg">
                        {bristol?.icon ?? "💩"}
                      </span>
                      <div>
                        <p className="font-semibold">
                          Type {log.bristolScore} —{" "}
                          {bristol?.label ?? "未知"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(log.loggedAt)} · {painUrgencyLabel}{" "}
                          {urgencyEmoji}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "self-start rounded-full px-2 py-0.5 text-xs font-medium",
                        log.bristolScore >= 6
                          ? "bg-red-100 text-red-700"
                          : log.bristolScore <= 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                      )}
                    >
                      {log.bristolScore >= 6
                        ? "腹泻"
                        : log.bristolScore <= 2
                          ? "便秘"
                          : "正常"}
                    </span>
                  </div>

                  {/* Meal summary */}
                  {log.meals.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {log.meals.map((meal, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-muted/50 px-2 py-0.5 text-xs"
                        >
                          {meal.foodName}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Symptom summary */}
                  {log.symptoms.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {log.symptoms.map((s, i) => {
                        const symType = SYMPTOM_TYPES.find(
                          (st) => st.value === s.type
                        );
                        return (
                          <span
                            key={i}
                            className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600"
                          >
                            {symType?.icon ?? "💊"} {symType?.label ?? s.type}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Toilet association */}
                  {log.toiletName && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      🚻 {log.toiletName}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={onLoadMore}
            className="inline-flex items-center gap-2 rounded-full bg-muted px-6 py-2 text-sm text-muted-foreground hover:bg-muted/80"
          >
            加载更多
          </button>
        </div>
      )}
    </div>
  );
}
