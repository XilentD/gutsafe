"use client";

import { usePathname } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/map": "拉了么",
  "/log": "肠道日志",
  "/log/new": "记录日志",
  "/insights": "健康洞察",
  "/routes": "我的路线",
  "/routes/plan": "规划路线",
  "/profile": "个人中心",
};

export function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // Find the closest matching title
  const title = pathname
    ? PAGE_TITLES[pathname] ??
      Object.entries(PAGE_TITLES).find(([key]) =>
        pathname.startsWith(key)
      )?.[1] ??
      "拉了么"
    : "拉了么";

  const canGoBack =
    pathname !== "/map" &&
    pathname !== "/log" &&
    pathname !== "/insights" &&
    pathname !== "/routes" &&
    pathname !== "/profile";

  return (
    <header className="safe-area-top flex h-12 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm">
      <div className="flex w-10 items-center">
        {canGoBack && (
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
            aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      <h1 className="text-sm font-semibold">{title}</h1>

      <div className="flex w-10 items-center justify-end">
        {pathname === "/map" && (
          <button
            onClick={() => {
              // TODO: Open search
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
            aria-label="搜索"
          >
            <Search className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}
