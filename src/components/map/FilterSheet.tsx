"use client";

import { useEffect, useRef } from "react";
import { X, RotateCcw } from "lucide-react";
import { useMapStore } from "@/lib/stores";
import { cn } from "@/lib/utils";
import type { ToiletFilters } from "@/types/toilet";

const FILTER_OPTIONS: {
  key: keyof ToiletFilters;
  label: string;
  icon: string;
}[] = [
  { key: "hasSquat", label: "有蹲便器", icon: "🚽" },
  { key: "hasToiletPaper", label: "提供卫生纸", icon: "🧻" },
  { key: "hasHandicap", label: "无障碍设施", icon: "♿" },
  { key: "isFree", label: "免费使用", icon: "🆓" },
];

const CLEANLINESS_OPTIONS = [
  { value: undefined, label: "不限" },
  { value: 4, label: "⭐ 4.0+" },
  { value: 3, label: "⭐ 3.0+" },
  { value: 2, label: "⭐ 2.0+" },
];

export function FilterSheet() {
  const isOpen = useMapStore((s) => s.isFilterSheetOpen);
  const filters = useMapStore((s) => s.filters);
  const setFilters = useMapStore((s) => s.setFilters);
  const clearFilters = useMapStore((s) => s.clearFilters);
  const toggleFilterSheet = useMapStore((s) => s.toggleFilterSheet);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) toggleFilterSheet();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, toggleFilterSheet]);

  const handleToggle = (key: keyof ToiletFilters) => {
    const current = filters[key];
    if (current === undefined) {
      setFilters({ [key]: true });
    } else if (current === true) {
      setFilters({ [key]: false });
    } else {
      // Remove the filter (set to undefined)
      setFilters({ [key]: undefined });
    }
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-black/40"
        onClick={toggleFilterSheet}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up rounded-t-2xl bg-card p-5 pb-8 shadow-xl">
        {/* Handle + Header */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">筛选卫生间</h3>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-primary"
              >
                <RotateCcw className="h-3 w-3" />
                清除全部
              </button>
            )}
            <button
              onClick={toggleFilterSheet}
              className="rounded-full p-1 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick toggle filters */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">设施</p>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((opt) => {
              const state = filters[opt.key];
              const isActive = state === true;
              const isExcluded = state === false;

              return (
                <button
                  key={opt.key}
                  onClick={() => handleToggle(opt.key)}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm transition-all",
                    isActive && "bg-primary text-primary-foreground shadow-sm",
                    isExcluded && "bg-red-100 text-red-700 line-through",
                    !isActive && !isExcluded && "bg-muted hover:bg-muted/80"
                  )}
                >
                  {opt.icon} {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cleanliness filter */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">最低评分</p>
          <div className="flex gap-2">
            {CLEANLINESS_OPTIONS.map((opt) => {
              const isActive =
                opt.value === undefined
                  ? filters.minCleanliness === undefined
                  : filters.minCleanliness === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  onClick={() => setFilters({ minCleanliness: opt.value })}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
