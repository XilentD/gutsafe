"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { LogTimeline } from "@/components/log/LogTimeline";
import type { GutLogSummary } from "@/types/gut-log";

export default function LogPage() {
  const [logs, setLogs] = useState<GutLogSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/gut-logs?page=${page}&pageSize=20`);
      if (res.ok) {
        const data = await res.json();
        setLogs((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
        setHasMore(page < data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse rounded-xl bg-muted p-4">
            <div className="mb-2 h-4 w-24 rounded bg-muted-foreground/20" />
            <div className="h-3 w-full rounded bg-muted-foreground/10" />
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <ClipboardList className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-semibold text-muted-foreground">
          还没有肠道日志
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground/70">
          记录你的饮食、症状和如厕情况，
          <br />
          发现食物与肠道健康的关联
        </p>
        <Link
          href="/log/new"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          记录第一条
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-20">
      <LogTimeline
        logs={logs}
        hasMore={hasMore}
        onLoadMore={() => setPage((p) => p + 1)}
      />
      <Link
        href="/log/new"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-110 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
