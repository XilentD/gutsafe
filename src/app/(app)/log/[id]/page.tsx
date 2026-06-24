"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Edit3 } from "lucide-react";
import { BRISTOL_SCALE, SYMPTOM_TYPES } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import type { GutLogDetail } from "@/types/gut-log";

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [log, setLog] = useState<GutLogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/gut-logs/${params.id}`)
      .then((r) => r.json())
      .then((d) => setLog(d.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("确定删除这条记录？")) return;
    try {
      const res = await fetch(`/api/gut-logs/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/log");
      }
    } catch {
      console.error("Delete failed");
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-8 w-32 rounded bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground">记录不存在</p>
      </div>
    );
  }

  const bristol = BRISTOL_SCALE.find((b) => b.score === log.bristolScore);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="rounded-full p-2 text-red-500 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-8">
        {/* Date + Bristol */}
        <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-2xl">
              {bristol?.icon ?? "💩"}
            </span>
            <div>
              <p className="text-lg font-bold">
                Type {log.bristolScore} — {bristol?.label ?? "未知"}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(log.loggedAt).toLocaleString("zh-CN")} ·{" "}
                {timeAgo(log.loggedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Pain + Urgency */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-card p-4 text-center shadow-sm ring-1 ring-border">
            <p className="text-sm text-muted-foreground">疼痛</p>
            <p className="text-2xl font-bold">
              {log.painLevel}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                /10
              </span>
            </p>
          </div>
          <div className="flex-1 rounded-xl bg-card p-4 text-center shadow-sm ring-1 ring-border">
            <p className="text-sm text-muted-foreground">急迫</p>
            <p className="text-2xl font-bold">
              {log.urgencyLevel}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                /10
              </span>
            </p>
          </div>
          <div className="flex-1 rounded-xl bg-card p-4 text-center shadow-sm ring-1 ring-border">
            <p className="text-sm text-muted-foreground">布里斯托</p>
            <p className="text-2xl font-bold">{log.bristolScore}</p>
          </div>
        </div>

        {/* Meals */}
        {log.meals.length > 0 && (
          <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="mb-2 text-sm font-semibold">饮食记录</p>
            <div className="flex flex-wrap gap-2">
              {log.meals.map((m, i) => (
                <span
                  key={i}
                  className="rounded-full bg-muted px-3 py-1 text-sm"
                >
                  🍽️ {m.foodName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Symptoms */}
        {log.symptoms.length > 0 && (
          <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="mb-2 text-sm font-semibold">症状</p>
            <div className="flex flex-wrap gap-2">
              {log.symptoms.map((s, i) => {
                const sym = SYMPTOM_TYPES.find((st) => st.value === s.type);
                return (
                  <span
                    key={i}
                    className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-600"
                  >
                    {sym?.icon ?? "💊"} {sym?.label ?? s.type} ({s.severity}/5)
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Toilet */}
        {log.toiletName && (
          <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="text-sm">
              🚻 关联卫生间：{log.toiletName}
            </p>
          </div>
        )}

        {/* Notes */}
        {log.notes && (
          <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="mb-1 text-sm font-semibold">备注</p>
            <p className="text-sm text-muted-foreground">{log.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
