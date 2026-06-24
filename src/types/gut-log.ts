export interface MealEntry {
  foodName: string;
  category?: string | null;
  portion?: string;
  mealTime?: string;
  hoursBeforeLog?: number;
}

export interface SymptomEntry {
  type: string;
  severity: number;
}

export interface GutLogFormData {
  loggedAt: string;
  bristolScore: number;
  urgencyLevel: number;
  painLevel: number;
  toiletId?: string;
  location?: { lng: number; lat: number };
  notes?: string;
  meals?: MealEntry[];
  symptoms?: SymptomEntry[];
}

export interface GutLogSummary {
  id: string;
  loggedAt: string;
  bristolScore: number;
  urgencyLevel: number;
  painLevel: number;
  toiletId: string | null;
  toiletName: string | null;
  notes: string | null;
  meals: Array<{
    foodName: string;
    category: string | null;
    portion: string;
    mealTime: string;
  }>;
  symptoms: Array<{
    type: string;
    severity: number;
  }>;
}

export interface GutLogDetail extends GutLogSummary {
  lat: number | null;
  lng: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BristolType {
  score: number;
  label: string;
  enLabel: string;
  description: string;
  icon: string;
}

export interface GutLogInsights {
  summary: {
    totalLogs: number;
    dateRange: { from: string; to: string };
    averageBristol: number;
    averagePain: number;
    averageUrgency: number;
  };
  foodCorrelations: Array<{
    foodName: string;
    category: string | null;
    logCount: number;
    avgPain: number;
    avgUrgency: number;
    symptomBreakdown: Record<string, number>;
    correlationScore: number;
  }>;
  bristolDistribution: Array<{
    score: number;
    count: number;
    percentage: number;
  }>;
  symptomFrequency: Array<{
    type: string;
    count: number;
    avgSeverity: number;
  }>;
  timePatterns: Array<{
    hour: number;
    logCount: number;
    avgPain: number;
  }>;
  topTriggers: string[];
}
