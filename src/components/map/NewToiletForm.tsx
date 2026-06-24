"use client";

import { useState } from "react";
import { X, MapPin, Loader2, Check, LocateFixed } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { wgs84ToGcj02 } from "@/lib/coord-convert";

const AMENITIES = [
  { key: "hasSquat", label: "蹲便器", icon: "🚽" },
  { key: "hasSeated", label: "坐便器", icon: "🪑" },
  { key: "hasToiletPaper", label: "卫生纸", icon: "🧻" },
  { key: "hasHandWash", label: "洗手台", icon: "🚰" },
  { key: "hasHandicap", label: "无障碍", icon: "♿" },
  { key: "hasChangingTable", label: "母婴台", icon: "👶" },
  { key: "hasMirror", label: "镜子", icon: "🪞" },
];

interface NewToiletFormProps {
  mapCenter?: { lng: number; lat: number };
  onClose: () => void;
  onSubmitted: () => void;
}

export function NewToiletForm({ mapCenter, onClose, onSubmitted }: NewToiletFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [feeCents, setFeeCents] = useState(0);
  const [amenities, setAmenities] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"info" | "amenities" | "confirm">("info");
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const toggleAmenity = (key: string) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error("您的设备不支持定位");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lng: pos.coords.longitude, lat: pos.coords.latitude });
        setIsLocating(false);
        toast.success("已定位到当前位置");
      },
      () => {
        setIsLocating(false);
        toast.error("定位失败，请检查位置权限");
      }
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !city.trim()) {
      toast.error("请填写厕所名称和所在城市");
      return;
    }
    setIsSubmitting(true);
    const location = userLocation || mapCenter || { lng: 116.397428, lat: 39.90923 };

    try {
      const res = await fetch("/api/toilets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || undefined,
          city: city.trim(),
          lng: location.lng,
          lat: location.lat,
          ...amenities,
          feeCents,
          dataSource: "user",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "提交失败");
      }

      toast.success("厕所已提交，感谢贡献！");
      onSubmitted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "提交失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-slide-up">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b px-4">
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-muted-foreground">
          <X className="h-5 w-5" /> 取消
        </button>
        <h1 className="text-sm font-semibold">提交新厕所</h1>
        <div className="w-14" />
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 px-4 pt-3">
        {["info", "amenities", "confirm"].map((s, i) => (
          <div key={s} className={cn("h-1 flex-1 rounded-full",
            ["info", "amenities", "confirm"].indexOf(step) >= i ? "bg-primary" : "bg-muted"
          )} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Basic info */}
        {step === "info" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">步骤 1/3 — 基本信息</p>

            <div>
              <label className="mb-1 block text-sm font-medium">厕所名称 *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="如：中山公园北门卫生间"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">城市 *</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="如：广州"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">地址（选填）</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="如：中山公园北门入口处"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">费用（选填）</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} step={100} value={feeCents}
                  onChange={(e) => setFeeCents(Number(e.target.value))}
                  className="w-24 rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                <span className="text-sm text-muted-foreground">分（0 = 免费）</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">厕所位置</label>
              {userLocation ? (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">📍 我的位置</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                    </p>
                  </div>
                  <button
                    onClick={() => setUserLocation(null)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    清除
                  </button>
                </div>
              ) : (
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {mapCenter
                          ? `📍 ${mapCenter.lat.toFixed(5)}, ${mapCenter.lng.toFixed(5)}（地图中心）`
                          : "📍 尚未设置位置"}
                      </p>
                    </div>
                    <button
                      onClick={handleLocate}
                      disabled={isLocating}
                      className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                      {isLocating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <LocateFixed className="h-3.5 w-3.5" />
                      )}
                      {isLocating ? "定位中..." : "定位"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setStep("amenities")}
              disabled={!name.trim() || !city.trim()}
              className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">
              下一步
            </button>
          </div>
        )}

        {/* Step 2: Amenities */}
        {step === "amenities" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">步骤 2/3 — 设施信息</p>
            <div className="grid grid-cols-1 gap-2">
              {AMENITIES.map((amenity) => (
                <button key={amenity.key} onClick={() => toggleAmenity(amenity.key)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                    amenities[amenity.key]
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/50"
                  )}>
                  <span className="text-xl">{amenity.icon}</span>
                  <span className="flex-1 text-sm font-medium">{amenity.label}</span>
                  {amenities[amenity.key] && <Check className="h-5 w-5 text-primary" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("info")}
                className="flex-1 rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted">
                上一步
              </button>
              <button onClick={() => setStep("confirm")}
                className="flex-1 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground">
                下一步
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">步骤 3/3 — 确认提交</p>
            <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border space-y-2">
              <p><span className="text-muted-foreground">名称：</span><span className="font-medium">{name}</span></p>
              <p><span className="text-muted-foreground">城市：</span><span className="font-medium">{city}</span></p>
              {address && <p><span className="text-muted-foreground">地址：</span>{address}</p>}
              <p><span className="text-muted-foreground">费用：</span>{feeCents > 0 ? `${feeCents / 100}元` : "免费"}</p>
              <div className="flex flex-wrap gap-1">
                {AMENITIES.filter((a) => amenities[a.key]).map((a) => (
                  <span key={a.key} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">{a.icon} {a.label}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("amenities")}
                className="flex-1 rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted">
                上一步
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "提交中..." : "确认提交"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
