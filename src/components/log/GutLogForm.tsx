"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BristolScaleSelector } from "./BristolScaleSelector";
import { PainSlider } from "./PainSlider";
import { UrgencySlider } from "./UrgencySlider";
import { MealInput } from "./MealInput";
import { SymptomSelector } from "./SymptomSelector";

const gutLogSchema = z.object({
  loggedAt: z.string().min(1, "请选择时间"),
  bristolScore: z.number().min(1).max(7),
  urgencyLevel: z.number().min(1).max(10),
  painLevel: z.number().min(0).max(10),
  toiletId: z.string().optional(),
  notes: z.string().optional(),
  meals: z
    .array(
      z.object({
        foodName: z.string().min(1),
        category: z.string().optional(),
        portion: z.string().optional(),
        mealTime: z.string().optional(),
      })
    )
    .optional(),
  symptoms: z
    .array(
      z.object({
        type: z.string(),
        severity: z.number().min(1).max(5),
      })
    )
    .optional(),
});

type GutLogFormValues = z.infer<typeof gutLogSchema>;

const STEPS = [
  { title: "布里斯托分型", field: "bristolScore" as const },
  { title: "急迫程度", field: "urgencyLevel" as const },
  { title: "疼痛等级", field: "painLevel" as const },
  { title: "饮食记录", field: "meals" as const },
  { title: "症状记录", field: "symptoms" as const },
];

export function GutLogForm() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const form = useForm<GutLogFormValues>({
    resolver: zodResolver(gutLogSchema),
    defaultValues: {
      loggedAt: new Date().toISOString(),
      bristolScore: 4,
      urgencyLevel: 5,
      painLevel: 0,
      meals: [],
      symptoms: [],
    },
  });

  const onSubmit = async (data: GutLogFormValues) => {
    try {
      const res = await fetch("/api/gut-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("日志已保存");
      router.push("/log");
    } catch {
      toast.error("保存失败，请重试");
    }
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s.field}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        步骤 {step + 1}/{STEPS.length}: {STEPS[step].title}
      </p>

      {/* Step content */}
      <div className="min-h-[300px]">
        {step === 0 && (
          <BristolScaleSelector
            value={form.watch("bristolScore")}
            onChange={(v) => form.setValue("bristolScore", v)}
          />
        )}
        {step === 1 && (
          <UrgencySlider
            value={form.watch("urgencyLevel")}
            onChange={(v) => form.setValue("urgencyLevel", v)}
          />
        )}
        {step === 2 && (
          <PainSlider
            value={form.watch("painLevel")}
            onChange={(v) => form.setValue("painLevel", v)}
          />
        )}
        {step === 3 && (
          <MealInput
            value={form.watch("meals") ?? []}
            onChange={(meals) => form.setValue("meals", meals)}
          />
        )}
        {step === 4 && (
          <SymptomSelector
            value={form.watch("symptoms") ?? []}
            onChange={(symptoms) => form.setValue("symptoms", symptoms)}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted"
          >
            上一步
          </button>
        )}
        {!isLastStep ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            下一步
          </button>
        ) : (
          <button
            type="submit"
            className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            保存日志
          </button>
        )}
      </div>
    </form>
  );
}
