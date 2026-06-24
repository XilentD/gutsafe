"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Route, Plus, Shield, ChevronRight } from "lucide-react";
import { formatDistance, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { RouteSummary } from "@/types/route";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await fetch("/api/routes");
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.data || []);
      }
    } catch {
      console.error("Failed to fetch routes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl bg-muted p-4">
            <div className="mb-2 h-4 w-32 rounded bg-muted-foreground/20" />
            <div className="h-3 w-48 rounded bg-muted-foreground/10" />
          </div>
        ))}
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <Route className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-semibold text-muted-foreground">
          还没有保存的路线
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground/70">
          规划一条「肠易激友好路线」，
          <br />
          确保沿途有足够的厕所保障
        </p>
        <Link
          href="/routes/plan"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          规划第一条路线
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-20">
      {routes.map((route) => {
        const safetyColor =
          route.safetyScore !== null
            ? route.safetyScore >= 0.7
              ? "text-green-500"
              : route.safetyScore >= 0.4
                ? "text-yellow-500"
                : "text-red-500"
            : "text-muted-foreground";

        return (
          <Link
            key={route.id}
            href={`/routes/${route.id}`}
            className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">
                  {route.name || `${route.startName} → ${route.endName}`}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {route.startName} → {route.endName}
                </p>
              </div>
              <ChevronRight className="ml-2 mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                📏 {route.totalDistanceMeters ? formatDistance(route.totalDistanceMeters) : "-"}
              </span>
              <span>🚻 {route.toiletCount}个厕所</span>
              {route.safetyScore !== null && (
                <span className={cn("flex items-center gap-1", safetyColor)}>
                  <Shield className="h-3 w-3" />
                  {Math.round(route.safetyScore * 100)}%
                </span>
              )}
            </div>
          </Link>
        );
      })}

      <Link
        href="/routes/plan"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-110 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
