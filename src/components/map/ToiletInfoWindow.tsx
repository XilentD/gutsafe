"use client";

import Link from "next/link";
import { X, Star, Clock, Navigation, Banknote, Footprints, Bike, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/utils";
import type { ToiletSummary } from "@/types/toilet";

interface ToiletInfoWindowProps {
  toilet: ToiletSummary;
  onClose: () => void;
  isNearest?: boolean;
  routeMode?: "walking" | "riding" | "driving";
  onRouteModeChange?: (mode: "walking" | "riding" | "driving") => void;
}

export function ToiletInfoWindow({ toilet, onClose, isNearest, routeMode, onRouteModeChange }: ToiletInfoWindowProps) {
  return (
    <div className="animate-slide-up rounded-2xl bg-card p-4 shadow-xl ring-1 ring-border">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{toilet.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {toilet.address || "地址未知"} · {formatDistance(toilet.distance)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Amenities row */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {toilet.hasSquat && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
            🚽 蹲便
          </span>
        )}
        {toilet.hasSeated && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
            🪑 坐便
          </span>
        )}
        {toilet.hasToiletPaper && (
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
            🧻 有纸
          </span>
        )}
        {toilet.hasHandicap && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
            ♿ 无障碍
          </span>
        )}
        {toilet.feeCents > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
            💰 收费
          </span>
        )}
      </div>

      {/* Route mode selector — only shown for nearest toilet */}
      {isNearest && onRouteModeChange && (
        <div className="mt-3 flex gap-2">
          {([
            { mode: "walking" as const, icon: Footprints, label: "步行", activeBg: "#dcfce7", activeText: "#15803d" },
            { mode: "riding" as const, icon: Bike, label: "骑行", activeBg: "#dbeafe", activeText: "#1d4ed8" },
            { mode: "driving" as const, icon: Car, label: "驾车", activeBg: "#ffedd5", activeText: "#c2410c" },
          ]).map(({ mode, icon: Icon, label, activeBg, activeText }) => (
            <button
              key={mode}
              onClick={() => onRouteModeChange(mode)}
              style={routeMode === mode ? { backgroundColor: activeBg, color: activeText, boxShadow: `0 0 0 1px ${activeText}40` } : {}}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all bg-muted text-muted-foreground hover:bg-muted/80"
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      )}

      {/* Rating + action */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Star
            className={cn(
              "h-4 w-4",
              toilet.avgCleanliness >= 4
                ? "text-yellow-500"
                : toilet.avgCleanliness >= 3
                  ? "text-blue-500"
                  : "text-muted-foreground"
            )}
            fill="currentColor"
          />
          <span className="text-sm font-medium">
            {toilet.avgCleanliness > 0 ? toilet.avgCleanliness.toFixed(1) : "暂无评分"}
          </span>
          <span className="text-xs text-muted-foreground">
            ({toilet.reviewCount}条评价)
          </span>
          {toilet.avgQueueMin && (
            <span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              排队{toilet.avgQueueMin}分钟
            </span>
          )}
        </div>

        <Link
          href={`/map/toilet/${toilet.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          详情
          <Navigation className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
