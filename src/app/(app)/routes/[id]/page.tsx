"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Trash2,
  MapPin,
  Navigation,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { formatDistance, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { RouteDetail } from "@/types/route";
import { toast } from "sonner";

export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/routes/${params.id}`)
      .then((r) => r.json())
      .then((d) => setRoute(d.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const res = await fetch(`/api/routes/${params.id}/share`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setShareUrl(data.data.shareUrl);
      } else {
        toast.error("生成分享链接失败");
      }
    } catch {
      toast.error("网络错误，生成分享链接失败");
    }
    setIsSharing(false);
  };

  const handleCopy = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("链接已复制");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("复制失败，请手动复制链接");
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定删除这条路线？")) return;
    try {
      const res = await fetch(`/api/routes/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("路线已删除");
        router.push("/routes");
      }
    } catch {
      toast.error("删除失败");
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground">路线不存在</p>
      </div>
    );
  }

  const safetyColor =
    route.safetyScore !== null
      ? route.safetyScore >= 0.7
        ? "text-green-500"
        : route.safetyScore >= 0.4
          ? "text-yellow-500"
          : "text-red-500"
      : "text-muted-foreground";

  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="rounded-full p-2 text-primary hover:bg-primary/10"
            title="分享路线"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-full p-2 text-red-500 hover:bg-red-50"
            title="删除路线"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Route name + safety */}
      <div className="px-4">
        <h1 className="text-xl font-bold truncate">
          {route.name || `${route.startName} → ${route.endName}`}
        </h1>
        {route.safetyScore !== null && (
          <div className="mt-2 flex items-center gap-2">
            <Shield className={safetyColor + " h-5 w-5"} />
            <span className={cn("text-lg font-bold", safetyColor)}>
              安全感 {Math.round(route.safetyScore * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card p-3 text-center shadow-sm ring-1 ring-border">
          <p className="text-xs text-muted-foreground">距离</p>
          <p className="text-lg font-bold">
            {route.totalDistanceMeters !== null
              ? formatDistance(route.totalDistanceMeters)
              : "-"}
          </p>
        </div>
        <div className="rounded-xl bg-card p-3 text-center shadow-sm ring-1 ring-border">
          <p className="text-xs text-muted-foreground">步行时间</p>
          <p className="text-lg font-bold">
            {route.estimatedDurationMin
              ? formatDuration(route.estimatedDurationMin)
              : "-"}
          </p>
        </div>
        <div className="rounded-xl bg-card p-3 text-center shadow-sm ring-1 ring-border">
          <p className="text-xs text-muted-foreground">厕所数量</p>
          <p className="text-lg font-bold text-primary">
            {route.toiletCount}
          </p>
        </div>
        <div className="rounded-xl bg-card p-3 text-center shadow-sm ring-1 ring-border">
          <p className="text-xs text-muted-foreground">最大间隔</p>
          <p className="text-lg font-bold">
            {route.maxGapMeters
              ? formatDistance(route.maxGapMeters)
              : "无"}
          </p>
        </div>
      </div>

      {/* Share URL */}
      {shareUrl && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-primary/5 p-3">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 bg-transparent text-xs text-muted-foreground outline-none"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "已复制" : "复制"}
          </button>
        </div>
      )}

      {/* Route points */}
      <div className="mx-4 mt-6">
        <div className="space-y-3">
          {/* Start */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-sm font-medium">{route.startName}</span>
          </div>

          {/* Pathway */}
          <div className="ml-4 border-l-2 border-dashed border-muted-foreground/30 pl-4">
            <p className="text-xs text-muted-foreground">
              最大限度间距 {route.maxToiletDistanceMeters}m
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              厕所密度 {route.toiletDensity ?? "?"}/km
            </p>
          </div>

          {/* Toilets along route */}
          {route.toilets.length > 0 && (
            <div className="ml-4 border-l-2 border-dashed border-muted-foreground/30 pl-4">
              <p className="mb-2 text-sm font-medium text-primary">
                🚻 沿途 {route.toilets.length} 个卫生间
              </p>
              <div className="space-y-2">
                {route.toilets.map((rt) => (
                  <div
                    key={rt.id}
                    className="flex items-start gap-2 rounded-lg bg-muted/30 p-2"
                  >
                    <span className="mt-0.5 text-lg">🚽</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {rt.toilet.name}
                      </p>
                      <p className="flex gap-2 text-xs text-muted-foreground">
                        {rt.isRecommended && (
                          <span className="text-primary">推荐</span>
                        )}
                        {rt.toilet.hasSquat && <span>蹲便</span>}
                        {rt.toilet.hasToiletPaper && <span>有纸</span>}
                        {rt.detourMeters > 0 && (
                          <span>绕路{rt.detourMeters}m</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* End */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
              <MapPin className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-sm font-medium">{route.endName}</span>
          </div>
        </div>
      </div>

      {/* Created date */}
      <div className="mx-4 mt-6 text-center text-xs text-muted-foreground">
        创建于 {new Date(route.createdAt).toLocaleString("zh-CN")}
      </div>
    </div>
  );
}
