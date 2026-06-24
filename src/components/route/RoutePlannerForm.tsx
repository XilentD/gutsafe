"use client";

import { useState } from "react";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { useUserPrefsStore } from "@/lib/stores";

export function RoutePlannerForm() {
  const defaultMaxDistance = useUserPrefsStore((s) => s.defaultMaxToiletDistance);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [maxDistance, setMaxDistance] = useState(defaultMaxDistance);
  const [isPlanning, setIsPlanning] = useState(false);

  const canPlan = start.trim() && end.trim();

  const handlePlan = async () => {
    if (!canPlan) return;
    setIsPlanning(true);
    // TODO: Implement route planning API call
    setTimeout(() => setIsPlanning(false), 1000);
  };

  return (
    <div className="space-y-4">
      {/* Start input */}
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
          <MapPin className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          placeholder="起点（地址或地点名）"
          className="flex-1 bg-transparent text-sm outline-none"
        />
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* End input */}
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
          <MapPin className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          placeholder="终点（地址或地点名）"
          className="flex-1 bg-transparent text-sm outline-none"
        />
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Max toilet distance slider */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">最大厕所间距</span>
          </div>
          <span className="text-sm font-bold text-primary">{maxDistance}m</span>
        </div>
        <input
          type="range"
          min={100}
          max={2000}
          step={50}
          value={maxDistance}
          onChange={(e) => setMaxDistance(Number(e.target.value))}
          className="mt-3 w-full accent-primary"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>100m (高保障)</span>
          <span>2000m (低保障)</span>
        </div>
      </div>

      {/* Plan button */}
      <button
        type="button"
        onClick={handlePlan}
        disabled={!canPlan || isPlanning}
        className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 disabled:opacity-50"
      >
        {isPlanning ? "正在规划..." : "规划路线"}
      </button>
    </div>
  );
}
