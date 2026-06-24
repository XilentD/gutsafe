"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {!isOnline && (
        <div className="flex h-8 items-center justify-center gap-2 bg-amber-500 px-4 text-xs font-medium text-white">
          <WifiOff className="h-3.5 w-3.5" />
          离线模式 — 数据将在恢复连接后同步
        </div>
      )}
      {showRestored && (
        <div className="flex h-8 items-center justify-center gap-2 bg-green-500 px-4 text-xs font-medium text-white animate-fade-in">
          ✅ 网络已恢复，正在同步数据...
        </div>
      )}
    </>
  );
}
