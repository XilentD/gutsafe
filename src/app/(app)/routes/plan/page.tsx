import { RoutePlannerForm } from "@/components/route/RoutePlannerForm";

export default function PlanRoutePage() {
  return (
    <div className="flex flex-1 flex-col p-4">
      <h2 className="mb-4 text-lg font-semibold">规划路线</h2>
      <RoutePlannerForm />
    </div>
  );
}
