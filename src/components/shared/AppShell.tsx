"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { TopHeader } from "./TopHeader";
import { OfflineIndicator } from "./OfflineIndicator";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreenMap = pathname === "/map" && !pathname.includes("/toilet/");
  const isRoutePlan = pathname?.startsWith("/routes/plan");

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Top Header — hidden on full-screen map */}
      {!isFullScreenMap && <TopHeader />}

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Main Content */}
      <main
        className={`flex-1 overflow-hidden ${
          isFullScreenMap || isRoutePlan ? "" : "overflow-y-auto"
        }`}
      >
        {children}
      </main>

      {/* Bottom Navigation — always visible in app shell */}
      <BottomNav />
    </div>
  );
}
