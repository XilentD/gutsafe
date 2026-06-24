"use client";

import { X } from "lucide-react";
import { useMapStore } from "@/lib/stores";

const FILTER_LABELS: Record<string, Record<string, string>> = {
  hasSquat: { true: "🚽 有蹲便", false: "无蹲便" },
  hasToiletPaper: { true: "🧻 有纸巾", false: "无纸巾" },
  hasHandicap: { true: "♿ 无障碍", false: "无障" },
  isFree: { true: "🆓 免费", false: "收费" },
  minCleanliness: { true: "⭐ {val}+" },
};

export function FilterChips() {
  const filters = useMapStore((s) => s.filters);
  const setFilters = useMapStore((s) => s.setFilters);
  const clearFilters = useMapStore((s) => s.clearFilters);

  const entries = Object.entries(filters).filter(
    ([, v]) => v !== undefined
  );

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-card/95 px-3 py-2 shadow-lg backdrop-blur">
      {entries.map(([key, value]) => {
        let label = FILTER_LABELS[key]?.[String(value)] ?? `${key}:${value}`;
        if (key === "minCleanliness") {
          label = `⭐ ${value}+`;
        }
        return (
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {label}
            <button
              onClick={() => setFilters({ [key]: undefined })}
              className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        );
      })}
      {entries.length > 1 && (
        <button
          onClick={clearFilters}
          className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/80"
        >
          清除全部
        </button>
      )}
    </div>
  );
}
