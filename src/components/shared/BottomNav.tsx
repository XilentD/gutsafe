"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, ClipboardList, BarChart3, Route, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/map",
    label: "地图",
    icon: MapPin,
    activePattern: /^\/map/,
  },
  {
    href: "/log",
    label: "日志",
    icon: ClipboardList,
    activePattern: /^\/log/,
  },
  {
    href: "/insights",
    label: "洞察",
    icon: BarChart3,
    activePattern: /^\/insights/,
  },
  {
    href: "/routes",
    label: "路线",
    icon: Route,
    activePattern: /^\/routes/,
  },
  {
    href: "/profile",
    label: "我的",
    icon: User,
    activePattern: /^\/profile/,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-area-bottom flex h-16 shrink-0 items-center justify-around border-t bg-background/95 backdrop-blur-sm">
      {NAV_ITEMS.map((item) => {
        const isActive = item.activePattern.test(pathname ?? "");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 transition-all",
                isActive && "scale-110"
              )}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
