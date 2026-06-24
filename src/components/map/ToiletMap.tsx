"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useMapContext } from "./MapProvider";
import { useMapStore } from "@/lib/stores";
import { wgs84ToGcj02 } from "@/lib/coord-convert";
import { cn } from "@/lib/utils";
import { ToiletInfoWindow } from "./ToiletInfoWindow";
import { FilterChips } from "./FilterChips";
import { FilterSheet } from "./FilterSheet";
import type { ToiletSummary } from "@/types/toilet";
import { SlidersHorizontal, Crosshair } from "lucide-react";

export function ToiletMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { amapInstance, mapInstance, isLoading, error, initMap, destroyMap } =
    useMapContext();
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const setCenter = useMapStore((s) => s.setCenter);
  const filters = useMapStore((s) => s.filters);
  const toggleFilterSheet = useMapStore((s) => s.toggleFilterSheet);

  const [toilets, setToilets] = useState<ToiletSummary[]>([]);
  const [selectedToilet, setSelectedToilet] = useState<ToiletSummary | null>(null);
  const [infoWindowPos, setInfoWindowPos] = useState<{ lng: number; lat: number } | null>(null);
  const markersRef = useRef<AMap.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || !amapInstance) return;

    initMap(containerRef.current, {
      center: [center[0], center[1]],
      zoom,
    });

    return () => {
      destroyMap();
    };
  }, [amapInstance]);

  // Track map movement
  useEffect(() => {
    if (!mapInstance) return;

    const handleMoveEnd = () => {
      const c = mapInstance.getCenter();
      if (c) {
        setCenter([c.getLng(), c.getLat()]);
      }
    };

    mapInstance.on("moveend", handleMoveEnd);
    return () => {
      mapInstance.off("moveend", handleMoveEnd);
    };
  }, [mapInstance, setCenter]);

  // Fetch toilets when map moves or filters change
  const fetchToilets = useCallback(async () => {
    if (!mapInstance) return;

    const bounds = mapInstance.getBounds();
    if (!bounds) return;

    const center = bounds.getCenter();
    const ne = bounds.getNorthEast();
    const distance = Math.round(
      AMap.GeometryUtil.distance(
        [center.getLng(), center.getLat()],
        [ne.getLng(), ne.getLat()]
      )
    );
    const radius = Math.min(distance, 5000);

    const params = new URLSearchParams({
      lat: String(center.getLat()),
      lng: String(center.getLng()),
      radius: String(radius),
    });

    if (filters.hasSquat !== undefined) params.set("hasSquat", String(filters.hasSquat));
    if (filters.hasToiletPaper !== undefined) params.set("hasToiletPaper", String(filters.hasToiletPaper));
    if (filters.hasHandicap !== undefined) params.set("hasHandicap", String(filters.hasHandicap));
    if (filters.isFree !== undefined) params.set("isFree", String(filters.isFree));
    if (filters.minCleanliness) params.set("minCleanliness", String(filters.minCleanliness));

    try {
      const res = await fetch(`/api/toilets/nearby?${params}`);
      if (res.ok) {
        const data = await res.json();
        setToilets(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch toilets:", err);
    }
  }, [mapInstance, filters]);

  useEffect(() => {
    fetchToilets();
  }, [fetchToilets]);

  // Place markers
  useEffect(() => {
    if (!amapInstance || !mapInstance) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    toilets.forEach((toilet) => {
      // Convert WGS-84 to GCJ-02 for Gaode map display
      const gcj = wgs84ToGcj02({ lng: toilet.lng, lat: toilet.lat });

      const content = document.createElement("div");
      content.className = cn(
        "flex items-center justify-center rounded-full px-2 py-1 text-xs font-bold text-white shadow-md transition-transform hover:scale-110 cursor-pointer",
        toilet.avgCleanliness >= 4
          ? "bg-green-500"
          : toilet.avgCleanliness >= 3
            ? "bg-blue-500"
            : "bg-yellow-500"
      );
      content.innerHTML = toilet.feeCents > 0 ? "💰" : "🚻";
      content.style.width = "36px";
      content.style.height = "36px";
      content.style.borderRadius = "50%";
      content.style.display = "flex";
      content.style.alignItems = "center";
      content.style.justifyContent = "center";

      const marker = new amapInstance.Marker({
        position: new amapInstance.LngLat(gcj.lng, gcj.lat),
        content,
        offset: new amapInstance.Pixel(-18, -18),
      });

      marker.on("click", () => {
        setSelectedToilet(toilet);
        setInfoWindowPos({ lng: toilet.lng, lat: toilet.lat });
      });

      marker.setMap(mapInstance);
      markersRef.current.push(marker);
    });
  }, [toilets, amapInstance, mapInstance]);

  // Geolocate
  const handleGeolocate = () => {
    if (!amapInstance || !mapInstance) return;
    const geolocation = new amapInstance.Geolocation({ enableHighAccuracy: true });
    geolocation.getCurrentPosition((status: string, result: { position: AMap.LngLat }) => {
      if (status === "complete" && result.position) {
        mapInstance.setCenter(result.position);
        mapInstance.setZoom(16);
      }
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-primary/20" />
          <p className="mt-3 text-sm text-muted-foreground">地图加载中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/30 p-4">
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-destructive">地图加载失败</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            请确认 GAODE_JS_API_KEY 已正确配置
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Map container */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Filter chips */}
      {Object.keys(filters).length > 0 && (
        <div className="absolute left-0 right-0 top-2 flex justify-center">
          <FilterChips />
        </div>
      )}

      {/* Control buttons */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button
          onClick={handleGeolocate}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card shadow-lg hover:bg-muted"
          aria-label="定位"
        >
          <Crosshair className="h-5 w-5 text-foreground" />
        </button>
        <button
          onClick={toggleFilterSheet}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card shadow-lg hover:bg-muted"
          aria-label="筛选"
        >
          <SlidersHorizontal className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Toilet count badge */}
      {toilets.length > 0 && (
        <div className="absolute bottom-4 left-4 rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur">
          🚻 {toilets.length} 个卫生间
        </div>
      )}

      {/* Info window on marker click */}
      {selectedToilet && infoWindowPos && (
        <div className="absolute bottom-24 left-4 right-4 z-10">
          <ToiletInfoWindow
            toilet={selectedToilet}
            onClose={() => {
              setSelectedToilet(null);
              setInfoWindowPos(null);
            }}
          />
        </div>
      )}

      {/* Filter sheet */}
      <FilterSheet />
    </div>
  );
}
