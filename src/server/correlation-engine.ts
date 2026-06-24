/**
 * Correlation engine for gut log insights.
 * Analyzes food→symptom correlations, Bristol distribution, time patterns.
 */
import { db } from "@/lib/db";

export interface FoodCorrelation {
  foodName: string;
  category: string | null;
  logCount: number;
  avgPain: number;
  avgUrgency: number;
  symptomBreakdown: Record<string, number>;
  correlationScore: number;
}

export interface BristolDistribution {
  score: number;
  count: number;
  percentage: number;
}

export interface SymptomFrequency {
  type: string;
  count: number;
  avgSeverity: number;
}

export interface TimePattern {
  hour: number;
  logCount: number;
  avgPain: number;
}

export interface InsightResult {
  summary: {
    totalLogs: number;
    dateRange: { from: string; to: string };
    averageBristol: number;
    averagePain: number;
    averageUrgency: number;
  };
  foodCorrelations: FoodCorrelation[];
  bristolDistribution: BristolDistribution[];
  symptomFrequency: SymptomFrequency[];
  timePatterns: TimePattern[];
  topTriggers: string[];
}

export async function computeInsights(
  userId: string,
  from?: string,
  to?: string
): Promise<InsightResult> {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();

  // Fetch all logs with meals and symptoms
  const logs = await db.gutLog.findMany({
    where: {
      userId,
      loggedAt: { gte: fromDate, lte: toDate },
    },
    include: {
      meals: true,
      symptoms: true,
    },
    orderBy: { loggedAt: "asc" },
  });

  const totalLogs = logs.length;

  if (totalLogs === 0) {
    return {
      summary: {
        totalLogs: 0,
        dateRange: { from: fromDate.toISOString(), to: toDate.toISOString() },
        averageBristol: 0,
        averagePain: 0,
        averageUrgency: 0,
      },
      foodCorrelations: [],
      bristolDistribution: [],
      symptomFrequency: [],
      timePatterns: [],
      topTriggers: [],
    };
  }

  // ── Summary ──
  const avgBristol = logs.reduce((s, l) => s + l.bristolScore, 0) / totalLogs;
  const avgPain = logs.reduce((s, l) => s + l.painLevel, 0) / totalLogs;
  const avgUrgency = logs.reduce((s, l) => s + l.urgencyLevel, 0) / totalLogs;

  // ── Bristol Distribution ──
  const bristolMap = new Map<number, number>();
  logs.forEach((l) => bristolMap.set(l.bristolScore, (bristolMap.get(l.bristolScore) || 0) + 1));
  const bristolDistribution: BristolDistribution[] = [];
  for (let score = 1; score <= 7; score++) {
    const count = bristolMap.get(score) || 0;
    bristolDistribution.push({
      score,
      count,
      percentage: totalLogs > 0 ? Math.round((count / totalLogs) * 100) : 0,
    });
  }

  // ── Food → Symptom Correlations ──
  // Group logs by food name
  const foodMap = new Map<string, {
    foodName: string;
    category: string | null;
    logs: typeof logs;
  }>();

  logs.forEach((log) => {
    log.meals.forEach((meal) => {
      const key = meal.foodName;
      if (!foodMap.has(key)) {
        foodMap.set(key, {
          foodName: meal.foodName,
          category: meal.category,
          logs: [],
        });
      }
      foodMap.get(key)!.logs.push(log);
    });
  });

  const foodCorrelations: FoodCorrelation[] = [];
  const allLogsAvgPain = avgPain;
  const allLogsAvgUrgency = avgUrgency;

  foodMap.forEach((entry) => {
    const symptomCounts: Record<string, number> = {};
    entry.logs.forEach((log) => {
      log.symptoms.forEach((s) => {
        symptomCounts[s.symptomType] = (symptomCounts[s.symptomType] || 0) + 1;
      });
    });

    const foodAvgPain = entry.logs.reduce((s, l) => s + l.painLevel, 0) / entry.logs.length;
    const foodAvgUrgency = entry.logs.reduce((s, l) => s + l.urgencyLevel, 0) / entry.logs.length;

    // Correlation score: weighted deviation from baseline
    const painDeviation = Math.max(0, (foodAvgPain - allLogsAvgPain) / 10);
    const urgencyDeviation = Math.max(0, (foodAvgUrgency - allLogsAvgUrgency) / 10);
    const symptomPenalty = Object.values(symptomCounts).reduce((s, c) => s + c, 0) / entry.logs.length;
    const correlationScore = Math.min(1, (painDeviation * 0.4 + urgencyDeviation * 0.3 + symptomPenalty * 0.3));

    if (entry.logs.length >= 1) {
      foodCorrelations.push({
        foodName: entry.foodName,
        category: entry.category,
        logCount: entry.logs.length,
        avgPain: Math.round(foodAvgPain * 10) / 10,
        avgUrgency: Math.round(foodAvgUrgency * 10) / 10,
        symptomBreakdown: symptomCounts,
        correlationScore: Math.round(correlationScore * 100) / 100,
      });
    }
  });

  // Sort by correlation score descending
  foodCorrelations.sort((a, b) => b.correlationScore - a.correlationScore);

  // ── Symptom Frequency ──
  const symptomFreqMap = new Map<string, { count: number; totalSeverity: number }>();
  logs.forEach((log) => {
    log.symptoms.forEach((s) => {
      const existing = symptomFreqMap.get(s.symptomType) || { count: 0, totalSeverity: 0 };
      existing.count++;
      existing.totalSeverity += s.severity;
      symptomFreqMap.set(s.symptomType, existing);
    });
  });

  const symptomFrequency: SymptomFrequency[] = [];
  symptomFreqMap.forEach((v, type) => {
    symptomFrequency.push({
      type,
      count: v.count,
      avgSeverity: Math.round((v.totalSeverity / v.count) * 10) / 10,
    });
  });
  symptomFrequency.sort((a, b) => b.count - a.count);

  // ── Time Patterns ──
  const hourMap = new Map<number, { count: number; totalPain: number }>();
  for (let h = 0; h < 24; h++) hourMap.set(h, { count: 0, totalPain: 0 });

  logs.forEach((l) => {
    const hour = new Date(l.loggedAt).getHours();
    const entry = hourMap.get(hour)!;
    entry.count++;
    entry.totalPain += l.painLevel;
  });

  const timePatterns: TimePattern[] = [];
  hourMap.forEach((v, hour) => {
    timePatterns.push({
      hour,
      logCount: v.count,
      avgPain: v.count > 0 ? Math.round((v.totalPain / v.count) * 10) / 10 : 0,
    });
  });
  timePatterns.sort((a, b) => a.hour - b.hour);

  // ── Top Triggers ──
  const topTriggers = foodCorrelations
    .filter((f) => f.correlationScore >= 0.3 && f.logCount >= 2)
    .slice(0, 5)
    .map((f) => f.foodName);

  return {
    summary: {
      totalLogs,
      dateRange: { from: fromDate.toISOString(), to: toDate.toISOString() },
      averageBristol: Math.round(avgBristol * 10) / 10,
      averagePain: Math.round(avgPain * 10) / 10,
      averageUrgency: Math.round(avgUrgency * 10) / 10,
    },
    foodCorrelations,
    bristolDistribution,
    symptomFrequency,
    timePatterns,
    topTriggers,
  };
}
