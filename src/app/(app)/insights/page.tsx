import { BarChart3 } from "lucide-react";

export default function InsightsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <BarChart3 className="h-16 w-16 text-muted-foreground/30" />
      <h2 className="mt-4 text-lg font-semibold text-muted-foreground">
        暂无健康洞察
      </h2>
      <p className="mt-1 text-center text-sm text-muted-foreground/70">
        记录至少10条肠道日志后，
        <br />
        系统将为你分析食物与症状的关联
      </p>
    </div>
  );
}
