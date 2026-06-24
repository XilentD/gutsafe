"use client";

import { MapPin } from "lucide-react";

export function MapPlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-muted/30">
      <div className="relative">
        <MapPin className="h-16 w-16 text-muted-foreground/30 animate-pulse-soft" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-primary/50" />
        </div>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-muted-foreground">
        地图加载中...
      </h2>
      <p className="mt-1 text-sm text-muted-foreground/70">
        请配置高德地图 API Key 以启用地图
      </p>
      <p className="mt-2 text-xs text-muted-foreground/50">
        GAODE_JS_API_KEY 需要配置在 .env.local 中
      </p>
    </div>
  );
}
