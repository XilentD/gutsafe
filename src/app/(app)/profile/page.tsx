"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  LogOut,
  Shield,
  Database,
  Moon,
  ChevronRight,
  Sun,
  Monitor,
  Check,
  Download,
  Trash2,
  ArrowLeft,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SettingsPanel = "theme" | "privacy" | "data" | null;

export default function ProfilePage() {
  const { data: session } = useSession();
  const [activePanel, setActivePanel] = useState<SettingsPanel>(null);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [anonymize, setAnonymize] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Read theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (saved) setTheme(saved);
  }, []);

  const applyTheme = (t: "light" | "dark" | "system") => {
    setTheme(t);
    localStorage.setItem("theme", t);
    if (t === "system") {
      document.documentElement.classList.remove("dark", "light");
    } else if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    toast.success(`已切换到${t === "light" ? "浅色" : t === "dark" ? "深色" : "跟随系统"}主题`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const [logsRes, routesRes] = await Promise.all([
        fetch("/api/gut-logs?pageSize=1000"),
        fetch("/api/routes?pageSize=100"),
      ]);
      const logs = await logsRes.json();
      const routes = await routesRes.json();
      const data = { exportDate: new Date().toISOString(), user: session?.user?.email, gutLogs: logs.data || [], routes: routes.data || [] };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `拉了么-数据导出-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("数据导出成功");
    } catch {
      toast.error("导出失败");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("确定要删除账号？所有数据将永久丢失，无法恢复。")) return;
    if (!confirm("再次确认：此操作不可撤销。")) return;
    toast.error("账号删除功能需要后端支持，请联系管理员");
  };

  // Panel content
  if (activePanel === "theme") {
    return (
      <div className="flex flex-1 flex-col p-4">
        <button onClick={() => setActivePanel(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> 返回设置
        </button>
        <h2 className="mt-4 text-lg font-bold">主题设置</h2>
        <div className="mt-4 space-y-2">
          {[
            { value: "light" as const, label: "浅色模式", icon: Sun },
            { value: "dark" as const, label: "深色模式", icon: Moon },
            { value: "system" as const, label: "跟随系统", icon: Monitor },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => applyTheme(opt.value)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 transition-all",
                theme === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-card hover:bg-muted"
              )}
            >
              <opt.icon className={cn("h-5 w-5", theme === opt.value ? "text-primary" : "text-muted-foreground")} />
              <span className="flex-1 text-left text-sm font-medium">{opt.label}</span>
              {theme === opt.value && <Check className="h-5 w-5 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activePanel === "privacy") {
    return (
      <div className="flex flex-1 flex-col p-4">
        <button onClick={() => setActivePanel(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> 返回设置
        </button>
        <h2 className="mt-4 text-lg font-bold">隐私设置</h2>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">匿名化肠道日志</p>
                <p className="text-xs text-muted-foreground">开启后日志数据不会关联到你的账号</p>
              </div>
              <button
                onClick={() => setAnonymize(!anonymize)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  anonymize ? "bg-primary" : "bg-muted"
                )}
              >
                <span className={cn(
                  "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  anonymize && "translate-x-5"
                )} />
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">数据说明</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  你的肠道日志存储在本地服务器，不会发送到第三方。
                  应用不使用任何第三方分析服务。
                  你可以随时在「数据管理」中导出或删除所有数据。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activePanel === "data") {
    return (
      <div className="flex flex-1 flex-col p-4">
        <button onClick={() => setActivePanel(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> 返回设置
        </button>
        <h2 className="mt-4 text-lg font-bold">数据管理</h2>

        <div className="mt-4 space-y-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3.5 transition-all hover:bg-muted disabled:opacity-50"
          >
            <Download className="h-5 w-5 text-primary" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">导出我的数据</p>
              <p className="text-xs text-muted-foreground">下载肠道日志和路线数据的 JSON 文件</p>
            </div>
            <span className="text-xs text-muted-foreground">{isExporting ? "导出中..." : "JSON"}</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="flex w-full items-center gap-3 rounded-xl border border-red-200 bg-card px-4 py-3.5 transition-all hover:bg-red-50"
          >
            <Trash2 className="h-5 w-5 text-red-500" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-red-600">删除账号</p>
              <p className="text-xs text-muted-foreground">永久删除所有数据和账号信息</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4">
      {/* Profile card */}
      <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
          {session?.user?.name?.[0] ?? "?"}
        </div>
        <div>
          <p className="font-semibold">{session?.user?.name ?? "用户"}</p>
          <p className="text-sm text-muted-foreground">{session?.user?.email ?? ""}</p>
        </div>
      </div>

      {/* Settings */}
      <div className="mt-6 space-y-1">
        <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">设置</h3>

        <button onClick={() => setActivePanel("theme")} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted">
          <Moon className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left text-sm">主题设置</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <button onClick={() => setActivePanel("privacy")} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left text-sm">隐私设置</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <button onClick={() => setActivePanel("data")} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted">
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
