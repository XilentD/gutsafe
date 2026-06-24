"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Banknote,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToiletDetail } from "@/types/toilet";

export function ToiletDetailView({ toilet }: { toilet: ToiletDetail }) {
  const router = useRouter();

  const amenities = [
    { key: "hasSquat", label: "蹲便器", icon: "🚽", value: toilet.hasSquat },
    { key: "hasSeated", label: "坐便器", icon: "🪑", value: toilet.hasSeated },
    { key: "hasToiletPaper", label: "卫生纸", icon: "🧻", value: toilet.hasToiletPaper },
    { key: "hasHandWash", label: "洗手台", icon: "🚰", value: toilet.hasHandWash },
    { key: "hasHandicap", label: "无障碍", icon: "♿", value: toilet.hasHandicap },
    { key: "hasChangingTable", label: "母婴台", icon: "👶", value: toilet.hasChangingTable },
    { key: "hasMirror", label: "镜子", icon: "🪞", value: toilet.hasMirror },
  ];

  return (
    <div className="flex flex-col">
      {/* Back button */}
      <div className="px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回地图
        </button>
      </div>

      {/* Header */}
      <div className="p-4">
        <h1 className="text-xl font-bold">{toilet.name}</h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>{toilet.address || "地址未知"}</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {toilet.district ? `${toilet.city} · ${toilet.district}` : toilet.city}
        </div>
      </div>

      {/* Score + meta bar */}
      <div className="mx-4 flex items-center gap-4 rounded-xl bg-muted/30 p-3">
        <div className="text-center">
          <div className="flex items-center gap-1">
            <Star
              className={cn(
                "h-5 w-5",
                toilet.avgCleanliness >= 4 ? "text-yellow-500" : "text-muted-foreground"
              )}
              fill="currentColor"
            />
            <span className="text-lg font-bold">
              {toilet.avgCleanliness > 0 ? toilet.avgCleanliness.toFixed(1) : "-"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{toilet.reviewCount}条评价</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold">
              {toilet.avgQueueMin ? `${toilet.avgQueueMin}min` : "-"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">平均排队</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <div className="flex items-center gap-1">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold">
              {toilet.feeCents > 0 ? `¥${(toilet.feeCents / 100).toFixed(1)}` : "免费"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">费用</p>
        </div>
      </div>

      {/* Amenities grid */}
      <div className="mx-4 mt-4">
        <h2 className="text-sm font-semibold">设施详情</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {amenities.map((amenity) => (
            <div
              key={amenity.key}
              className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2"
            >
              <span className="text-lg">{amenity.icon}</span>
              <span className="flex-1 text-sm">{amenity.label}</span>
              {amenity.value ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground/30" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Opening hours */}
      {toilet.openingHours && (
        <div className="mx-4 mt-4">
          <h2 className="text-sm font-semibold">开放时间</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {toilet.openingHoursType === "24h" ? "24小时开放" : toilet.openingHours}
          </p>
        </div>
      )}

      {/* Reviews */}
      <div className="mx-4 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">用户评价 ({toilet.reviewCount})</h2>
          <button
            onClick={() => router.push(`/map/toilet/${toilet.id}/review/new`)}
            className="text-xs font-medium text-primary"
          >
            + 写评价
          </button>
        </div>

        {toilet.reviews.length === 0 ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            暂无评价，成为第一个评价的人
          </p>
        ) : (
          <div className="mt-2 space-y-3">
            {toilet.reviews.map((review) => (
              <div key={review.id} className="rounded-lg bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {review.user.name || "匿名用户"}
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < review.cleanliness
                            ? "text-yellow-500"
                            : "text-muted-foreground/30"
                        )}
                        fill="currentColor"
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <MessageSquare className="mr-1 inline-block h-3 w-3" />
                    {review.comment}
                  </p>
                )}
                <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                  {review.hasTissue !== null && (
                    <span>{review.hasTissue ? "🧻 有纸" : "🧻 无纸"}</span>
                  )}
                  {review.queueMinutes && <span>⏱ 排队{review.queueMinutes}分钟</span>}
                  <span>{new Date(review.visitedAt).toLocaleDateString("zh-CN")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data source footer */}
      <div className="mx-4 mb-8 mt-4 text-center text-xs text-muted-foreground">
        数据来源：{toilet.dataSource === "osm" ? "OpenStreetMap" : toilet.dataSource === "gaode" ? "高德地图" : toilet.dataSource === "government" ? "政府数据" : "用户贡献"}
        {toilet.verified && " ✅ 已认证"}
      </div>
    </div>
  );
}
