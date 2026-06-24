"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SYMPTOM_TYPES } from "@/lib/constants";

interface SymptomEntry {
  type: string;
  severity: number;
}

interface SymptomSelectorProps {
  value: SymptomEntry[];
  onChange: (symptoms: SymptomEntry[]) => void;
}

export function SymptomSelector({ value, onChange }: SymptomSelectorProps) {
  const toggleSymptom = (symptomType: string) => {
    const existing = value.find((s) => s.type === symptomType);
    if (existing) {
      onChange(value.filter((s) => s.type !== symptomType));
    } else {
      onChange([...value, { type: symptomType, severity: 3 }]);
    }
  };

  const setSeverity = (symptomType: string, severity: number) => {
    onChange(
      value.map((s) =>
        s.type === symptomType ? { ...s, severity } : s
      )
    );
  };

  const selectedTypes = new Set(value.map((s) => s.type));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">选择你经历的症状：</p>

      <div className="flex flex-wrap gap-2">
        {SYMPTOM_TYPES.map((symptom) => {
          const isSelected = selectedTypes.has(symptom.value);
          return (
            <button
              key={symptom.value}
              type="button"
              onClick={() => toggleSymptom(symptom.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <span>{symptom.icon}</span>
              <span>{symptom.label}</span>
            </button>
          );
        })}
      </div>

      {/* Severity for selected symptoms */}
      {value.length > 0 && (
        <div className="space-y-3 rounded-xl bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground">调整严重程度：</p>
          {value.map((entry) => {
            const symptom = SYMPTOM_TYPES.find((s) => s.value === entry.type);
            return (
              <div key={entry.type} className="flex items-center gap-3">
                <span className="w-20 text-sm">
                  {symptom?.icon} {symptom?.label}
                </span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={entry.severity}
                  onChange={(e) =>
                    setSeverity(entry.type, Number(e.target.value))
                  }
                  className="flex-1 accent-primary"
                />
                <span className="w-6 text-center text-sm font-bold">
                  {entry.severity}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
