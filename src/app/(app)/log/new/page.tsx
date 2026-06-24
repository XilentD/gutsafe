import { GutLogForm } from "@/components/log/GutLogForm";

export default function NewLogPage() {
  return (
    <div className="flex flex-1 flex-col p-4">
      <h2 className="mb-4 text-lg font-semibold">记录肠道日志</h2>
      <GutLogForm />
    </div>
  );
}
