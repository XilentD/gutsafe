"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, Shield, Database, Moon, ChevronRight } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-1 flex-col p-4">
      {/* Profile card */}
      <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
          {session?.user?.name?.[0] ?? "?"}
        </div>
        <div>
          <p className="font-semibold">{session?.user?.name ?? "用户"}</p>
          <p className="text-sm text-muted-foreground">
            {session?.user?.email ?? ""}
          </p>
        </div>
      </div>

      {/* Settings sections */}
      <div className="mt-6 space-y-1">
        <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
          设置
        </h3>

        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted">
          <Moon className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left text-sm">主题设置</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left text-sm">隐私设置</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted">
          <Database className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left text-sm">数据管理</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Logout */}
      <div className="mt-auto pb-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-red-500 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">退出登录</span>
        </button>
      </div>
    </div>
  );
}
