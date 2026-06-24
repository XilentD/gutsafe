import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";

export default function LogPage() {
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
