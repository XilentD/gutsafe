"use client";

const URGENCY_LABELS = [
  "完全可控",
  "稍感急迫",
  "轻度急迫",
  "中等急迫",
  "比较急迫",
  "很急迫",
  "非常急迫",
  "极度急迫",
  "几乎失禁",
  "完全失控",
];

interface UrgencySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function UrgencySlider({ value, onChange }: UrgencySliderProps) {
  const label = URGENCY_LABELS[Math.min(value - 1, 9)];

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2">
        <span className="text-3xl font-bold text-primary">{value}</span>
        <span className="text-lg font-semibold">{label}</span>
      </div>
      <div className="space-y-2">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 — 可忍</span>
          <span>10 — 刻不容缓</span>
        </div>
      </div>
    </div>
  );
}
