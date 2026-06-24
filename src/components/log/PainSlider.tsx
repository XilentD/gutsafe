"use client";

import { cn } from "@/lib/utils";

const PAIN_FACES = ["😊", "😐", "😣", "😖", "😫", "😭"];
const PAIN_LABELS = ["无痛", "轻微不适", "轻度疼痛", "中度疼痛", "较重疼痛", "剧烈疼痛"];

interface PainSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function PainSlider({ value, onChange }: PainSliderProps) {
  const level = Math.floor(value / 2); // map 0-10 to 0-5
  const face = PAIN_FACES[Math.min(level, 5)];
  const label = PAIN_LABELS[Math.min(level, 5)];

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2">
        <span className="text-5xl transition-all">{face}</span>
        <span className="text-lg font-semibold">{label}</span>
        <span className="text-3xl font-bold text-primary">{value}</span>
      </div>
      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0 — 无痛</span>
          <span>10 — 最痛</span>
        </div>
      </div>
    </div>
  );
}
