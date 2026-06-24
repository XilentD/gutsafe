"use client";

import dynamic from "next/dynamic";

const DynamicMapPageContent = dynamic(
  () =>
    import("@/components/map/MapPageContent").then(
      (mod) => mod.MapPageContent
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-primary/20" />
          <p className="mt-3 text-sm text-muted-foreground">地图加载中...</p>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  return <DynamicMapPageContent />;
}
