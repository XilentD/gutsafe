"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useMapContext } from "./MapProvider";
import { useMapStore } from "@/lib/stores";
import { wgs84ToGcj02 } from "@/lib/coord-convert";
import { ToiletInfoWindow } from "./ToiletInfoWindow";
import { FilterChips } from "./FilterChips";
import { FilterSheet } from "./FilterSheet";
import type { ToiletSummary } from "@/types/toilet";
import { SlidersHorizontal, MapPin, Loader2, LocateFixed } from "lucide-react";

export function ToiletMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { amapInstance, mapInstance, isLoading, error, initMap, destroyMap, retry } =
    useMapContext();
  const setCenter = useMapStore((s) => s.setCenter);
  const filters = useMapStore((s) => s.filters);
  const toggleFilterSheet = useMapStore((s) => s.toggleFilterSheet);

  const [toilets, setToilets] = useState<ToiletSummary[]>([]);
  const [selectedToilet, setSelectedToilet] = useState<ToiletSummary | null>(null);
  const [infoWindowPos, setInfoWindowPos] = useState<{ lng: number; lat: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const markersRef = useRef<AMap.Marker[]>([]);
  const userMarkerRef = useRef<AMap.Marker | null>(null);
  const initialGeolocateDone = useRef(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || !amapInstance) return;
    initMap(containerRef.current, {
      center: [116.397428, 39.90923],
      zoom: 14,
    });
    return () => destroyMap();
  }, [amapInstance]);

  // Track map movement
  useEffect(() => {
    if (!mapInstance) return;
    const handleMoveEnd = () => {
      const c = mapInstance.getCenter();
      if (c) setCenter([c.getLng(), c.getLat()]);
    };
    mapInstance.on("moveend", handleMoveEnd);
    return () => mapInstance.off("moveend", handleMoveEnd);
  }, [mapInstance, setCenter]);

  // Fetch toilets when map moves or filters change
  const fetchToilets = useCallback(async () => {
    if (!mapInstance) return;
    const bounds = mapInstance.getBounds();
    if (!bounds) return;
    const c = bounds.getCenter();
    const ne = bounds.getNorthEast();
    const dist = Math.round(AMap.GeometryUtil.distance([c.getLng(), c.getLat()], [ne.getLng(), ne.getLat()]));
    const params = new URLSearchParams({
      lat: String(c.getLat()),
      lng: String(c.getLng()),
      radius: String(Math.min(dist, 5000)),
    });
    if (filters.hasSquat !== undefined) params.set("hasSquat", String(filters.hasSquat));
    if (filters.hasToiletPaper !== undefined) params.set("hasToiletPaper", String(filters.hasToiletPaper));
    if (filters.hasHandicap !== undefined) params.set("hasHandicap", String(filters.hasHandicap));
    if (filters.isFree !== undefined) params.set("isFree", String(filters.isFree));
    if (filters.minCleanliness) params.set("minCleanliness", String(filters.minCleanliness));
    try {
      const res = await fetch(`/api/toilets/nearby?${params}`);
      if (res.ok) { const d = await res.json(); setToilets(d.data || []); }
    } catch { /* ignore */ }
  }, [mapInstance, filters]);

  useEffect(() => { fetchToilets(); }, [fetchToilets]);

  // Place toilet markers
  useEffect(() => {
    if (!amapInstance || !mapInstance) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    toilets.forEach((toilet) => {
      const gcj = wgs84ToGcj02(toilet);
      const el = document.createElement("div");
      el.textContent = toilet.feeCents > 0 ? "💰" : "🚻";
      el.style.cssText = `width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;background:${toilet.avgCleanliness >= 4 ? '#22c55e' : toilet.avgCleanliness >= 3 ? '#3b82f6' : '#eab308'};box-shadow:0 2px 6px rgba(0,0,0,0.2);cursor:pointer;`;
      const marker = new amapInstance.Marker({
        position: new amapInstance.LngLat(gcj.lng, gcj.lat),
        content: el,
        offset: new amapInstance.Pixel(-18, -18),
      });
      marker.on("click", () => { setSelectedToilet(toilet); setInfoWindowPos(toilet); });
      marker.setMap(mapInstance);
      markersRef.current.push(marker);
    });
  }, [toilets, amapInstance, mapInstance]);

  // User location blue dot marker
  useEffect(() => {
    if (!amapInstance || !mapInstance || !userLocation) return;
    userMarkerRef.current?.remove();
    const gcj = wgs84ToGcj02(userLocation);
    const dot = document.createElement("div");
    dot.style.cssText = `width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#4A90D9,#2563EB);border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.4);`;
    const pulse = document.createElement("div");
    pulse.style.cssText = `position:absolute;top:-8px;left:-8px;width:36px;height:36px;border-radius:50%;background:rgba(37,99,235,0.15);animation:pulse-soft 2s ease-in-out infinite;`;
    dot.appendChild(pulse);
    const marker = new amapInstance.Marker({
      position: new amapInstance.LngLat(gcj.lng, gcj.lat),
      content: dot,
      offset: new amapInstance.Pixel(-18, -18),
      zIndex: 1000,
    });
    marker.setMap(mapInstance);
    userMarkerRef.current = marker;
  }, [userLocation, amapInstance, mapInstance]);

  // Auto-geolocate on first load
  useEffect(() => {
    if (amapInstance && mapInstance && !initialGeolocateDone.current) {
      initialGeolocateDone.current = true;
      getUserLocation(true);
    }
  }, [amapInstance, mapInstance]);

  const getUserLocation = async (autoCenter = false) => {
    if (!navigator.geolocation) { setLocationError("您的设备不支持定位功能"); return; }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lng: pos.coords.longitude, lat: pos.coords.latitude };
        setUserLocation(loc);
        setIsLocating(false);
        setCenter([loc.lng, loc.lat]);
        if (autoCenter && mapInstance) {
          const gcj = wgs84ToGcj02(loc);
          mapInstance.setCenter(new AMap.LngLat(gcj.lng, gcj.lat));
          mapInstance.setZoom(16);
        }
      },
      (err) => {
        setIsLocating(false);
        const msgs: Record<number, string> = {
          [err.PERMISSION_DENIED]: "定位权限被拒绝，请在浏览器设置中允许",
          [err.POSITION_UNAVAILABLE]: "无法获取位置信息",
          [err.TIMEOUT]: "定位超时，请重试",
        };
        setLocationError(msgs[err.code] || "定位失败");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleGeolocate = () => getUserLocation(true);

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
        <div className="max-w-sm text-center space-y-3">
          <p className="text-sm font-medium text-destructive">地图加载失败</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <button
            onClick={retry}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 active:scale-95"
          >
            <Loader2 className="h-3.5 w-3.5" />
            重试加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {Object.keys(filters).length > 0 && (
        <div className="absolute left-0 right-0 top-2 flex justify-center">
          <FilterChips />
        </div>
      )}

      {/* Control buttons */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button
          onClick={handleGeolocate}
          disabled={isLocating}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card shadow-lg transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
          aria-label="我的位置"
          title="我的位置"
        >
          {isLocating ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <LocateFixed className="h-5 w-5 text-primary" />
          )}
        </button>
        <button
          onClick={toggleFilterSheet}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card shadow-lg hover:bg-muted"
          aria-label="筛选"
        >
          <SlidersHorizontal className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-4 left-3 right-3">
        <div className="flex items-center justify-between">
          {toilets.length > 0 && (
            <div className="rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur">
              🚻 {toilets.length} 个卫生间
            </div>
          )}
          <div className="ml-auto">
            {locationError && (
              <button
                onClick={handleGeolocate}
                className="flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur hover:bg-red-500"
              >
                <MapPin className="h-3 w-3" /> {locationError}
              </button>
            )}
            {isLocating && (
              <div className="flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur">
                <Loader2 className="h-3 w-3 animate-spin" /> 定位中...
              </div>
            )}
            {userLocation && !isLocating && !locationError && (
              <div className="rounded-full bg-primary/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur">
                📍 已定位
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedToilet && infoWindowPos && (
        <div className="absolute bottom-24 left-4 right-4 z-10">
          <ToiletInfoWindow
            toilet={selectedToilet}
            onClose={() => { setSelectedToilet(null); setInfoWindowPos(null); }}
          />
        </div>
      )}

      <FilterSheet />
    </div>
  );
}
