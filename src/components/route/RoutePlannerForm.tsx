"use client";

import { useState } from "react";
import {
  MapPin,
  SlidersHorizontal,
  Save,
  Shield,
  AlertTriangle,
  LocateFixed,
  Loader2,
  Crosshair,
} from "lucide-react";
import { useUserPrefsStore } from "@/lib/stores";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDistance, formatDuration } from "@/lib/utils";
import { MapLocationPicker } from "@/components/map/MapLocationPicker";
import type { RoutePlanResult } from "@/types/route";

export function RoutePlannerForm() {
  const router = useRouter();
  const defaultMaxDistance = useUserPrefsStore(
    (s) => s.defaultMaxToiletDistance
  );
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startCoord, setStartCoord] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [endCoord, setEndCoord] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [maxDistance, setMaxDistance] = useState(defaultMaxDistance);
  const [isPlanning, setIsPlanning] = useState(false);
  const [result, setResult] = useState<RoutePlanResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState<"start" | "end" | null>(null);
  const [showMapPicker, setShowMapPicker] = useState<"start" | "end" | null>(null);

  const canPlan = start.trim() && end.trim() && startCoord && endCoord;

  const useCurrentLocation = async (field: "start" | "end") => {
    if (!navigator.geolocation) {
      toast.error("您的设备不支持定位功能");
      return;
    }
    setIsLocating(field);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (field === "start") {
          setStartCoord(loc);
          setStart("我的位置");
        } else {
          setEndCoord(loc);
          setEnd("我的位置");
        }
        setIsLocating(null);
        toast.success("已获取当前位置");
      },
      () => {
        setIsLocating(null);
        toast.error("定位失败，请检查定位权限");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapSelect = (field: "start" | "end", location: { lat: number; lng: number; address?: string }) => {
    if (field === "start") {
      setStartCoord({ lat: location.lat, lng: location.lng });
      setStart(location.address || `已选位置`);
    } else {
      setEndCoord({ lat: location.lat, lng: location.lng });
      setEnd(location.address || `已选位置`);
    }
    setShowMapPicker(null);
  };

  const convertToCoord = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch { /* fallback */ }
    if (address.includes("天安门") || address.includes("广场")) return { lat: 39.90872, lng: 116.397128 };
    if (address.includes("王府井")) return { lat: 39.91427, lng: 116.410718 };
    if (address.includes("国贸")) return { lat: 39.90842, lng: 116.460178 };
    if (address.includes("三里屯")) return { lat: 39.933145, lng: 116.454382 };
    if (address.includes("西单")) return { lat: 39.91312, lng: 116.373448 };
    return null;
  };

  const handlePlan = async () => {
    if (!canPlan) return;
    setIsPlanning(true);
    setResult(null);
    try {
      const res = await fetch("/api/routes/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: { name: start, lat: startCoord!.lat, lng: startCoord!.lng },
          end: { name: end, lat: endCoord!.lat, lng: endCoord!.lng },
          maxToiletDistance: maxDistance,
        }),
      });
      if (!res.ok) throw new Error("Planning failed");
      const data = await res.json();
      setResult(data.data);
      toast.success("路线规划完成");
    } catch {
      toast.error("路线规划失败，请重试");
    } finally {
      setIsPlanning(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${start} → ${end}`,
          start: { name: start, lat: startCoord!.lat, lng: startCoord!.lng },
          end: { name: end, lat: endCoord!.lat, lng: endCoord!.lng },
          maxToiletDistance: maxDistance,
          planResult: result,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("路线已保存");
      router.push("/routes");
    } catch {
      toast.error("保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlur = async (field: "start" | "end") => {
    const val = field === "start" ? start : end;
    if (!val.trim()) return;
    if (val === "我的位置" && (field === "start" ? startCoord : endCoord)) return;
    if (val.startsWith("已选位置") && (field === "start" ? startCoord : endCoord)) return;
    const coord = await convertToCoord(val);
    if (coord) {
      if (field === "start") setStartCoord(coord);
      else setEndCoord(coord);
    }
  };

  const safetyColor =
    result && result.safetyScore >= 0.7
      ? "text-green-500"
      : result && result.safetyScore >= 0.4
        ? "text-yellow-500"
        : "text-red-500";

  const isLocatingField = (f: "start" | "end") => isLocating === f;

  return (
    <div className="space-y-4">
      {/* Start input */}
      <LocationInput
        label="起点"
        value={start}
        onChange={(v) => { setStart(v); if (v !== "我的位置" && !v.startsWith("已选")) setStartCoord(null); }}
        onBlur={() => handleBlur("start")}
        placeholder="起点（如：天安门广场）"
        color="green"
        isLocating={isLocatingField("start")}
        onLocate={() => useCurrentLocation("start")}
        onPickMap={() => setShowMapPicker("start")}
      />

      {/* End input */}
      <LocationInput
        label="终点"
        value={end}
        onChange={(v) => { setEnd(v); if (v !== "我的位置" && !v.startsWith("已选")) setEndCoord(null); }}
        onBlur={() => handleBlur("end")}
        placeholder="终点（如：王府井大街）"
        color="red"
        isLocating={isLocatingField("end")}
        onLocate={() => useCurrentLocation("end")}
        onPickMap={() => setShowMapPicker("end")}
      />

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
        {isPlanning ? "正在规划中..." : "规划路线"}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className={safetyColor + " h-5 w-5"} />
                <span className="text-sm font-semibold">路线安全评分</span>
              </div>
              <span className={`text-2xl font-bold ${safetyColor}`}>
                {Math.round(result.safetyScore * 100)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-card p-3 text-center shadow-sm ring-1 ring-border">
              <p className="text-xs text-muted-foreground">总距离</p>
              <p className="text-lg font-bold">{formatDistance(result.totalDistanceMeters)}</p>
            </div>
            <div className="rounded-xl bg-card p-3 text-center shadow-sm ring-1 ring-border">
              <p className="text-xs text-muted-foreground">步行时间</p>
              <p className="text-lg font-bold">{formatDuration(result.estimatedDurationMinutes)}</p>
            </div>
            <div className="rounded-xl bg-card p-3 text-center shadow-sm ring-1 ring-border">
              <p className="text-xs text-muted-foreground">沿途厕所</p>
              <p className="text-lg font-bold text-primary">{result.toilets.length}</p>
            </div>
            <div className="rounded-xl bg-card p-3 text-center shadow-sm ring-1 ring-border">
              <p className="text-xs text-muted-foreground">厕所密度</p>
              <p className="text-lg font-bold">{result.toiletDensity}/km</p>
            </div>
          </div>

          <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                覆盖 {result.coverage}% 的路段在厕所 {maxDistance}m 范围内
              </span>
              <span className="text-sm font-bold">
                {result.maxGapMeters > 0 ? `最大间隔 ${formatDistance(result.maxGapMeters)}` : "全覆盖"}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${result.coverage >= 80 ? "bg-green-500" : result.coverage >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(result.coverage, 100)}%` }}
              />
            </div>
          </div>

          {result.alerts.length > 0 && (
            <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
              <p className="mb-2 text-sm font-semibold">⚠️ 注意事项</p>
              <div className="space-y-2">
                {result.alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-yellow-600">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "保存中..." : "保存路线"}
          </button>
        </div>
      )}

      {/* Map picker modal */}
      {showMapPicker && (
        <MapLocationPicker
          initialLocation={showMapPicker === "start" ? startCoord ?? undefined : endCoord ?? undefined}
          onSelect={(loc) => handleMapSelect(showMapPicker, loc)}
          onClose={() => setShowMapPicker(null)}
        />
      )}
    </div>
  );
}

// ─── Location Input Sub-Component ──────────────────────

function LocationInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  color,
  isLocating,
  onLocate,
  onPickMap,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder: string;
  color: "green" | "red";
  isLocating: boolean;
  onLocate: () => void;
  onPickMap: () => void;
}) {
  const pinColors = {
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${pinColors[color]}`}
      >
        <MapPin className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm outline-none"
      />
      <div className="flex shrink-0 gap-1">
        {/* Current location button */}
        <button
          type="button"
          onClick={onLocate}
          disabled={isLocating}
          className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20 disabled:opacity-50"
          title="使用当前位置"
        >
          {isLocating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">定位</span>
        </button>
        {/* Pick on map button */}
        <button
          type="button"
          onClick={onPickMap}
          className="flex items-center gap-1 rounded-lg bg-secondary px-2 py-1.5 text-xs font-medium text-secondary-foreground transition-all hover:bg-secondary/80"
          title="在地图上选择"
        >
          <Crosshair className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">选点</span>
        </button>
      </div>
    </div>
  );
}
