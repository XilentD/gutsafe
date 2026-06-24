import Link from "next/link";
import { Route, Plus } from "lucide-react";

export default function RoutesPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <Route className="h-16 w-16 text-muted-foreground/30" />
      <h2 className="mt-4 text-lg font-semibold text-muted-foreground">
        还没有保存的路线
      </h2>
      <p className="mt-1 text-center text-sm text-muted-foreground/70">
        规划一条「肠易激友好路线」，
        <br />
        确保沿途有足够的厕所保障
      </p>
      <Link
        href="/routes/plan"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        规划第一条路线
      </Link>
    </div>
  );
}
