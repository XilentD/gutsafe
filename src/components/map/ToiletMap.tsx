"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useMapContext } from "./MapProvider";
import { useMapStore } from "@/lib/stores";
import { wgs84ToGcj02, haversineDistance } from "@/lib/coord-convert";
import { ToiletInfoWindow } from "./ToiletInfoWindow";
import { FilterChips } from "./FilterChips";
import { FilterSheet } from "./FilterSheet";
import { NewToiletForm } from "./NewToiletForm";
import type { ToiletSummary } from "@/types/toilet";
import { SlidersHorizontal, MapPin, Loader2, LocateFixed, ChevronDown, Navigation, Plus, Target, Footprints, Bike, Car } from "lucide-react";

const CITIES = [
  { name: "北京", center: [116.397428, 39.90923] as [number, number] },
  { name: "广州", center: [113.264385, 23.12911] as [number, number] },
  { name: "深圳", center: [114.057868, 22.543099] as [number, number] },
  { name: "珠海", center: [113.576726, 22.270715] as [number, number] },
  { name: "佛山", center: [113.121416, 23.021478] as [number, number] },
  { name: "东莞", center: [113.751765, 23.020536] as [number, number] },
  { name: "惠州", center: [114.416783, 23.111847] as [number, number] },
  { name: "上海", center: [121.473701, 31.230416] as [number, number] },
];

export function ToiletMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ctx = useMapContext();
  const { amapInstance, mapInstance, isLoading, loadingStage, error, initMap, destroyMap, retry, userLocation } = ctx;
  const setCenter = useMapStore((s) => s.setCenter);
  const filters = useMapStore((s) => s.filters);
  const toggleFilterSheet = useMapStore((s) => s.toggleFilterSheet);

  const [toilets, setToilets] = useState<ToiletSummary[]>([]);
  const [selectedToilet, setSelectedToilet] = useState<ToiletSummary | null>(null);
  const [infoWindowPos, setInfoWindowPos] = useState<{ lng: number; lat: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showNewToilet, setShowNewToilet] = useState(false);
  const [isFindingNearest, setIsFindingNearest] = useState(false);
  const [nearestToilet, setNearestToilet] = useState<ToiletSummary | null>(null);
  const [routeMode, setRouteMode] = useState<"walking" | "riding" | "driving">("walking");
  const nearestLocRef = useRef<{ lng: number; lat: number } | null>(null);
  const nearestToiletRef = useRef<ToiletSummary | null>(null);
  const markersRef = useRef<AMap.Marker[]>([]);
  const userMarkerRef = useRef<AMap.Marker | null>(null);
  const polylineRef = useRef<AMap.Polyline | null>(null);
  const routeSeqRef = useRef(0);
  const mapRef = useRef<AMap.Map | null>(null);

  // Initialize map — use userLocation if available, fallback to Beijing
  useEffect(() => {
    if (!containerRef.current || !amapInstance) return;
    const center = userLocation
      ? [userLocation.lng, userLocation.lat] as [number, number]
      : [116.397428, 39.90923] as [number, number];
    initMap(containerRef.current, { center, zoom: userLocation ? 15 : 14 });
    return () => destroyMap();
  }, [amapInstance, userLocation]);

  // Keep mapRef in sync
  useEffect(() => { mapRef.current = mapInstance; }, [mapInstance]);

  // Fetch toilets when map moves or filters change
  const fetchToilets = useCallback(async () => {
    if (!mapInstance) return;
    const bounds = mapInstance.getBounds();
    if (!bounds) return;
    const c = bounds.getCenter();
    const ne = bounds.getNorthEast();
    const dist = Math.round(haversineDistance({ lng: c.getLng(), lat: c.getLat() }, { lng: ne.getLng(), lat: ne.getLat() }));
    const params = new URLSearchParams({
      lat: String(c.getLat()), lng: String(c.getLng()),
      radius: String(Math.max(500, Math.min(dist, 5000))),
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

  // Refresh toilets on map drag
  const fetchToiletsRef = useRef(fetchToilets);
  fetchToiletsRef.current = fetchToilets;
  useEffect(() => {
    if (!mapInstance) return;
    const handleMoveEnd = () => {
      const c = mapInstance.getCenter();
      if (c) setCenter([c.getLng(), c.getLat()]);
      fetchToiletsRef.current();
    };
    mapInstance.on("moveend", handleMoveEnd);
    return () => mapInstance.off("moveend", handleMoveEnd);
  }, [mapInstance, setCenter]);

  const nearestToiletIdRef = useRef<string | null>(null);

  // Toilet markers — highlight the nearest/focused toilet
  useEffect(() => {
    if (!amapInstance || !mapInstance) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const isHighlighted = (id: string) => id === nearestToilet?.id;

    toilets.forEach((toilet) => {
      try {
        // Guard against NaN coordinates (e.g., from bad API data)
        if (!Number.isFinite(toilet.lng) || !Number.isFinite(toilet.lat)) return;
        const gcj = wgs84ToGcj02(toilet);
        if (!Number.isFinite(gcj.lng) || !Number.isFinite(gcj.lat)) return;
        const highlight = isHighlighted(toilet.id);
        const el = document.createElement("div");
        el.innerHTML = highlight
          ? `<div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:22px;border-radius:50%;background:#f97316;box-shadow:0 0 0 6px rgba(249,115,22,0.3),0 4px 12px rgba(0,0,0,0.3);z-index:999;animation: pulse-soft 1.2s ease-in-out infinite">${toilet.feeCents > 0 ? "💰" : "🚻"}</div>`
          : `<div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;background:${toilet.avgCleanliness >= 4 ? '#22c55e' : toilet.avgCleanliness >= 3 ? '#3b82f6' : '#eab308'};box-shadow:0 2px 6px rgba(0,0,0,0.2);cursor:pointer">${toilet.feeCents > 0 ? "💰" : "🚻"}</div>`;

        const marker = new amapInstance.Marker({
          position: new amapInstance.LngLat(gcj.lng, gcj.lat),
          content: el,
          offset: highlight ? new amapInstance.Pixel(-24, -24) : new amapInstance.Pixel(-18, -18),
          zIndex: highlight ? 999 : 100,
        });
        marker.on("click", () => { setSelectedToilet(toilet); setInfoWindowPos(toilet); });
        marker.setMap(mapInstance);
        markersRef.current.push(marker);
      } catch (err) {
        console.warn("Failed to render toilet marker:", toilet.name, err);
      }
    });
  }, [toilets, amapInstance, mapInstance, nearestToilet?.id]);

  // User location blue dot
  useEffect(() => {
    if (!amapInstance || !mapInstance || !userLocation) return;
    if (!Number.isFinite(userLocation.lng) || !Number.isFinite(userLocation.lat)) return;
    try {
      userMarkerRef.current?.remove();
      const gcj = wgs84ToGcj02(userLocation);
      if (!Number.isFinite(gcj.lng) || !Number.isFinite(gcj.lat)) return;
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
    } catch (err) {
      console.warn("Failed to render user location marker:", err);
    }
  }, [userLocation, amapInstance, mapInstance]);

  // Manual geolocate
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) { setLocationError("您的设备不支持定位功能"); return; }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lng: pos.coords.longitude, lat: pos.coords.latitude };
        setIsLocating(false);
        setCenter([loc.lng, loc.lat]);
        if (mapInstance) {
          const gcj = wgs84ToGcj02(loc);
          mapInstance.setCenter(new AMap.LngLat(gcj.lng, gcj.lat));
          mapInstance.setZoom(16);
        }
      },
      () => { setIsLocating(false); setLocationError("定位失败"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [mapInstance, setCenter]);

  // Draw route — dashed fallback + REST API solid road path
  const drawRoute = useCallback((loc: { lng: number; lat: number }, toilet: ToiletSummary, mode: "walking" | "riding" | "driving") => {
    if (!amapInstance || !mapInstance || !mapRef.current) return;
    if (!Number.isFinite(loc.lng) || !Number.isFinite(loc.lat)) return;
    if (!Number.isFinite(toilet.lng) || !Number.isFinite(toilet.lat)) return;

    routeSeqRef.current++;
    const seq = routeSeqRef.current;

    const start = wgs84ToGcj02(loc);
    const end = wgs84ToGcj02({ lng: toilet.lng, lat: toilet.lat });
    if (!Number.isFinite(start.lng) || !Number.isFinite(start.lat)) return;
    if (!Number.isFinite(end.lng) || !Number.isFinite(end.lat)) return;

    const colors: Record<string, string> = { walking: "#22c55e", riding: "#3b82f6", driving: "#f97316" };

    // Clear previous
    if (polylineRef.current) { mapRef.current.remove(polylineRef.current); polylineRef.current = null; }

    // ── Dashed fallback ──
    const dashed = new amapInstance.Polyline({
      path: [[start.lng, start.lat], [end.lng, end.lat]],
      strokeColor: colors[mode],
      strokeWeight: 4,
      strokeOpacity: 0.4,
      strokeStyle: "dashed",
      zIndex: 50,
    });
    dashed.setMap(mapRef.current);
    polylineRef.current = dashed;

    // ── Real road path from backend API ──
    fetch(`/api/directions?mode=${mode}&origin=${start.lng},${start.lat}&destination=${end.lng},${end.lat}`)
      .then(r => r.json())
      .then(data => {
        if (seq !== routeSeqRef.current) return;
        if (String(data.status) !== "1" || !data.route?.paths?.[0]?.steps) return;

        const pts: [number, number][] = [];
        for (const s of data.route.paths[0].steps) {
          if (!s.polyline) continue;
          for (const c of s.polyline.split(";")) {
            const [lng, lat] = c.split(",").map(Number);
            if (!isNaN(lng) && !isNaN(lat)) pts.push([lng, lat]);
          }
        }
        if (pts.length < 2) return;

        // Replace dashed with solid
        if (polylineRef.current) { mapRef.current!.remove(polylineRef.current); polylineRef.current = null; }
        const solid = new amapInstance.Polyline({
          path: pts,
          strokeColor: colors[mode],
          strokeWeight: 6,
          strokeOpacity: 0.8,
          zIndex: 51,
        });
        solid.setMap(mapRef.current!);
        polylineRef.current = solid;

        // Fit view
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        mapRef.current!.setFitView(null, false,
          new amapInstance.Bounds(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)));
      })
      .catch(() => {});
  }, [amapInstance, mapInstance]);

  const handleFindNearest = useCallback(async (mode: "walking" | "riding" | "driving" = "walking") => {
    if (!amapInstance || !mapInstance) return;
    setRouteMode(mode);
    setLocationError(null);

    let loc = userLocation;
    if (!loc && navigator.geolocation) {
      try {
        loc = await new Promise<{ lng: number; lat: number }>((res, rej) => {
          navigator.geolocation.getCurrentPosition(
            (p) => res({ lng: p.coords.longitude, lat: p.coords.latitude }),
            () => rej(new Error()),
            { enableHighAccuracy: true, timeout: 6000 }
          );
        });
      } catch {}
    }
    // Fallback to map center
    if (!loc && mapInstance) {
      const c = mapInstance.getCenter();
      if (c) loc = { lng: c.getLng(), lat: c.getLat() };
    }
    if (!loc) { setLocationError("无法获取位置"); return; }

    setIsFindingNearest(true);
    try {
      // Progressively expand radius
      let toilet: ToiletSummary | undefined;
      for (const radius of [5000, 20000, 100000]) {
        const res = await fetch(`/api/toilets/nearby?lat=${loc.lat}&lng=${loc.lng}&radius=${radius}&pageSize=1&sortBy=distance`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.data?.length) { toilet = data.data[0]; break; }
      }
      if (!toilet) { setLocationError("附近未找到卫生间"); setIsFindingNearest(false); return; }

      setNearestToilet(toilet);
      setSelectedToilet(toilet);
      setInfoWindowPos({ lng: toilet.lng, lat: toilet.lat });
      nearestLocRef.current = loc;
      nearestToiletRef.current = toilet;
      drawRoute(loc, toilet, mode);
    } catch {
      setLocationError("搜索附近厕所时出错");
    } finally {
      setIsFindingNearest(false);
    }
  }, [amapInstance, mapInstance, userLocation, drawRoute]);

  const jumpToCity = (city: typeof CITIES[number]) => {
    if (!mapInstance || !amapInstance) return;
    // CITIES already holds GCJ-02 coords — no conversion needed
    mapInstance.setCenter(new amapInstance.LngLat(city.center[0], city.center[1]));
    mapInstance.setZoom(13);
    setShowCityPicker(false);
  };

  // Loading state — shows while AMap loads AND while getting user location
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            {loadingStage.includes("位置") ? (
              <Navigation className="h-7 w-7 animate-pulse text-primary" />
            ) : (
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            )}
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">{loadingStage}</p>
          <p className="mt-1 text-xs text-muted-foreground">首次加载可能需要几秒钟</p>
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
          <button onClick={retry} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 active:scale-95">
            <Loader2 className="h-3.5 w-3.5" /> 重试加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* City quick-switch */}
      <div className="absolute left-3 top-3 z-10">
        <button onClick={() => setShowCityPicker(!showCityPicker)}
          className="flex items-center gap-1.5 rounded-xl bg-card/95 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur transition-all hover:bg-card">
          <MapPin className="h-4 w-4 text-primary" /> 切换城市 <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        {showCityPicker && (
          <div className="mt-1 overflow-hidden rounded-xl bg-card shadow-xl ring-1 ring-border animate-fade-in">
            {CITIES.map((city) => (
              <button key={city.name} onClick={() => jumpToCity(city)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-muted">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {city.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter chips */}
      {Object.keys(filters).length > 0 && (
        <div className="absolute left-0 right-0 top-14 flex justify-center"><FilterChips /></div>
      )}

      {/* Control buttons */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button onClick={handleGeolocate} disabled={isLocating}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card shadow-lg transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
          aria-label="我的位置" title="我的位置">
          {isLocating ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <LocateFixed className="h-5 w-5 text-primary" />}
        </button>
        <button onClick={toggleFilterSheet}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card shadow-lg hover:bg-muted" aria-label="筛选" title="筛选">
          <SlidersHorizontal className="h-5 w-5 text-foreground" />
        </button>
        <button onClick={() => setShowNewToilet(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg text-primary-foreground hover:bg-primary/90" aria-label="提交新厕所" title="提交新厕所">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Nearest toilet FAB */}
      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <button
          onClick={() => handleFindNearest(routeMode)}
          disabled={isFindingNearest || isLoading}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-xl transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
        >
          {isFindingNearest ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Target className="h-4 w-4" />
          )}
          {isFindingNearest ? "搜索中..." : nearestToilet ? `最近：${nearestToilet.name}（${Math.round(nearestToilet.distance)}m）` : "一键找厕所"}
        </button>
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-20 left-3 right-3">
        <div className="flex items-center justify-between">
          {toilets.length > 0 && (
            <div className="rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur">
              🚻 {toilets.length} 个卫生间
            </div>
          )}
          <div className="ml-auto">
            {locationError && (
              <button onClick={handleGeolocate} className="flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur hover:bg-red-500">
                <MapPin className="h-3 w-3" /> 定位失败
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
            isNearest={selectedToilet.id === nearestToilet?.id}
            routeMode={routeMode}
            onRouteModeChange={(mode) => {
              setRouteMode(mode);
              if (nearestLocRef.current && nearestToiletRef.current) {
                drawRoute(nearestLocRef.current, nearestToiletRef.current, mode);
              }
            }}
          />
        </div>
      )}

      <FilterSheet />

      {showNewToilet && (
        <NewToiletForm
          mapCenter={mapInstance?.getCenter() ? { lng: mapInstance.getCenter()!.getLng(), lat: mapInstance.getCenter()!.getLat() } : undefined}
          onClose={() => setShowNewToilet(false)}
          onSubmitted={() => { setShowNewToilet(false); fetchToiletsRef.current(); }}
        />
      )}
    </div>
  );
}
