"use client";

import { BRISTOL_SCALE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BristolScaleSelectorProps {
  value: number;
  onChange: (score: number) => void;
}

export function BristolScaleSelector({ value, onChange }: BristolScaleSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">选择最接近你排便形态的类型：</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {BRISTOL_SCALE.map((type) => (
          <button
            key={type.score}
            type="button"
            onClick={() => onChange(type.score)}
            className={cn(
              "flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all",
              value === type.score
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-transparent bg-muted/50 hover:bg-muted"
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-xl shadow-sm">
              {type.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                Type {type.score} — {type.label}
              </p>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
