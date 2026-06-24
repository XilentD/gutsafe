"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { loadAMap } from "@/lib/amap-loader";
import { wgs84ToGcj02, gcj02ToWgs84 } from "@/lib/coord-convert";
import { X, MapPin, Check } from "lucide-react";

interface MapLocationPickerProps {
  onSelect: (location: { lat: number; lng: number; address?: string }) => void;
  onClose: () => void;
  initialLocation?: { lat: number; lng: number };
}

export function MapLocationPicker({
  onSelect,
  onClose,
  initialLocation,
}: MapLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMap.Map | null>(null);
  const markerRef = useRef<AMap.Marker | null>(null);
  const [amap, setAmap] = useState<typeof AMap | null>(null);
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState("");

  // Load AMap
  useEffect(() => {
    let cancelled = false;
    loadAMap({ plugins: [] })
      .then((a) => { if (!cancelled) setAmap(a); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Init map
  const initMapFn = useCallback(() => {
    if (!amap || !containerRef.current || mapRef.current) return;

    const center = initialLocation
      ? wgs84ToGcj02(initialLocation)
      : { lng: 116.397428, lat: 39.90923 };

    const map = new amap.Map(containerRef.current, {
      zoom: 15,
      center: [center.lng, center.lat],
      viewMode: "2D",
      resizeEnable: true,
    });

    mapRef.current = map;

    // Place marker at initial location or center
    const pos = initialLocation
      ? new amap.LngLat(center.lng, center.lat)
      : map.getCenter();
    addMarker(pos);

    // Click to select
    map.on("click", (e: unknown) => {
      const ev = e as { lnglat: AMap.LngLat };
      const gcj = ev.lnglat;
      const wgs = gcj02ToWgs84({ lng: gcj.getLng(), lat: gcj.getLat() });
      setSelectedPos(wgs);
      addMarker(new amap.LngLat(gcj.getLng(), gcj.getLat()));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const geocoder = new (amap as any).Geocoder();
      (geocoder as any).getLocation?.(
        `${gcj.getLat()},${gcj.getLng()}`,
        (_s: string, result: { geocodes: Array<{ formattedAddress: string }> }) => {
          if (result?.geocodes?.[0]) {
            setAddress(result.geocodes[0].formattedAddress);
          }
        }
      );
    });
  }, [amap, initialLocation]);

  const addMarker = (pos: AMap.LngLat) => {
    if (!amap || !mapRef.current) return;
    markerRef.current?.remove();
    const content = document.createElement("div");
    content.innerHTML = "📍";
    content.style.cssText = "font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));";
    const marker = new amap.Marker({
      position: pos,
      content,
      offset: new amap.Pixel(-14, -28),
    });
    marker.setMap(mapRef.current);
    markerRef.current = marker;
  };

  useEffect(() => { if (amap) initMapFn(); }, [amap, initMapFn]);

  const handleConfirm = () => {
    if (selectedPos) {
      onSelect({ ...selectedPos, address: address || undefined });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b px-4">
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-muted-foreground">
          <X className="h-5 w-5" /> 取消
        </button>
        <h1 className="text-sm font-semibold">在地图上选择位置</h1>
        {selectedPos ? (
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1 text-sm font-medium text-primary"
          >
            <Check className="h-4 w-4" /> 确认
          </button>
        ) : (
          <div className="w-14" />
        )}
      </div>

      {/* Map */}
      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/30">
            <p className="text-sm text-muted-foreground">地图加载中...</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-muted/30 p-4">
            <p className="text-sm font-medium text-destructive">地图加载失败</p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />

        {/* Center crosshair hint */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <MapPin className="h-8 w-8 text-primary drop-shadow-lg" />
        </div>

        <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground">
          点击地图选择位置
        </p>
      </div>

      {/* Selected info bar */}
      {selectedPos && (
        <div className="border-t bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">
            已选坐标：{selectedPos.lat.toFixed(5)}, {selectedPos.lng.toFixed(5)}
          </p>
          {address && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {address}
            </p>
          )}
          <button
            onClick={handleConfirm}
            className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground"
          >
            确认选择此位置
          </button>
        </div>
      )}
    </div>
  );
}
