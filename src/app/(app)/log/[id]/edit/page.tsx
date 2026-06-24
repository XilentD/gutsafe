"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BristolScaleSelector } from "@/components/log/BristolScaleSelector";
import { PainSlider } from "@/components/log/PainSlider";
import { UrgencySlider } from "@/components/log/UrgencySlider";
import { MealInput } from "@/components/log/MealInput";
import { SymptomSelector } from "@/components/log/SymptomSelector";
import { toast } from "sonner";
import type { GutLogDetail } from "@/types/gut-log";

export default function EditLogPage() {
  const params = useParams();
  const router = useRouter();
  const [log, setLog] = useState<GutLogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [bristolScore, setBristolScore] = useState(4);
  const [urgencyLevel, setUrgencyLevel] = useState(5);
  const [painLevel, setPainLevel] = useState(0);
  const [meals, setMeals] = useState<Array<{ foodName: string; category?: string; portion?: string; mealTime?: string }>>([]);
  const [symptoms, setSymptoms] = useState<Array<{ type: string; severity: number }>>([]);
  const [notes, setNotes] = useState("");

  const [step, setStep] = useState(0);
  const STEPS = [
    { title: "布里斯托分型" },
    { title: "急迫程度" },
    { title: "疼痛等级" },
    { title: "饮食记录" },
    { title: "症状记录" },
  ];

  useEffect(() => {
    fetch(`/api/gut-logs/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        const data = d.data as GutLogDetail;
        setLog(data);
        setBristolScore(data.bristolScore);
        setUrgencyLevel(data.urgencyLevel);
        setPainLevel(data.painLevel);
        setMeals((data.meals || []).map((m: { foodName: string; category: string | null; portion: string; mealTime: string }) => ({ foodName: m.foodName, category: m.category ?? undefined, portion: m.portion, mealTime: m.mealTime })));
        setSymptoms((data.symptoms || []).map((s: { type: string; severity: number }) => ({ type: s.type, severity: s.severity })));
        setNotes(data.notes || "");
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/gut-logs/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bristolScore,
          urgencyLevel,
          painLevel,
          notes: notes || null,
          meals,
          symptoms,
        }),
      });
      if (!res.ok) throw new Error("保存失败");
      toast.success("修改已保存");
      router.push(`/log/${params.id}`);
    } catch {
      toast.error("保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!log) {
    return <div className="p-8 text-center text-muted-foreground">记录不存在</div>;
  }

  return (
    <div className="flex flex-col p-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>
      <h2 className="mt-3 text-lg font-semibold">编辑日志</h2>

      {/* Step indicator */}
      <div className="mt-4 flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s.title} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">步骤 {step + 1}/{STEPS.length}: {STEPS[step].title}</p>

      <div className="mt-4 min-h-[280px]">
        {step === 0 && <BristolScaleSelector value={bristolScore} onChange={setBristolScore} />}
        {step === 1 && <UrgencySlider value={urgencyLevel} onChange={setUrgencyLevel} />}
        {step === 2 && <PainSlider value={painLevel} onChange={setPainLevel} />}
        {step === 3 && <MealInput value={meals} onChange={setMeals} />}
        {step === 4 && <SymptomSelector value={symptoms} onChange={setSymptoms} />}
      </div>

      <div className="mt-4 space-y-2">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="备注（选填）"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          rows={2} />
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="flex-1 rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted">上一步</button>
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">下一步</button>
        ) : (
          <button onClick={handleSave} disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? "保存中..." : "保存修改"}
          </button>
        )}
      </div>
    </div>
  );
}
