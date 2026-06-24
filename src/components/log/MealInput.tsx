"use client";

import { useState } from "react";
import { Plus, X, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOOD_CATEGORIES, MEAL_TIMES, PORTION_SIZES } from "@/lib/constants";

interface MealEntry {
  foodName: string;
  category?: string;
  portion?: string;
  mealTime?: string;
}

interface MealInputProps {
  value: MealEntry[];
  onChange: (meals: MealEntry[]) => void;
}

export function MealInput({ value, onChange }: MealInputProps) {
  const [foodName, setFoodName] = useState("");
  const [category, setCategory] = useState("");
  const [portion, setPortion] = useState("medium");
  const [mealTime, setMealTime] = useState("");

  const addMeal = () => {
    if (!foodName.trim()) return;
    onChange([
      ...value,
      {
        foodName: foodName.trim(),
        category: category || undefined,
        portion,
        mealTime: mealTime || undefined,
      },
    ]);
    setFoodName("");
    setCategory("");
  };

  const removeMeal = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">记录近期的饮食（可选）：</p>

      {/* Input */}
      <div className="space-y-2">
        <input
          type="text"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          placeholder="食物名称，如：麻辣火锅、冰咖啡..."
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addMeal();
            }
          }}
        />
        <div className="flex flex-wrap gap-2">
          {FOOD_CATEGORIES.slice(0, 6).map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(category === cat.value ? "" : cat.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs transition-colors",
                category === cat.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={portion}
            onChange={(e) => setPortion(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-xs"
          >
            {PORTION_SIZES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select
            value={mealTime}
            onChange={(e) => setMealTime(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-xs"
          >
            <option value="">选择餐次</option>
            {MEAL_TIMES.map((mt) => (
              <option key={mt.value} value={mt.value}>{mt.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={addMeal}
            disabled={!foodName.trim()}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-3 w-3" /> 添加
          </button>
        </div>
      </div>

      {/* Meal list */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((meal, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
            >
              <Utensils className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{meal.foodName}</span>
              {meal.category && (
                <span className="rounded-full bg-background px-2 py-0.5 text-xs">
                  {FOOD_CATEGORIES.find((c) => c.value === meal.category)?.icon}{" "}
                  {FOOD_CATEGORIES.find((c) => c.value === meal.category)?.label}
                </span>
              )}
              {meal.mealTime && (
                <span className="text-xs text-muted-foreground">
                  {MEAL_TIMES.find((m) => m.value === meal.mealTime)?.label}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeMeal(i)}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
