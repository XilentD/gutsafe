export interface RoutePlanRequest {
  start: { name?: string; lng: number; lat: number };
  end: { name?: string; lng: number; lat: number };
  maxToiletDistance: number;
  waypoints?: Array<{ lng: number; lat: number }>;
}

export interface RoutePlanToilet {
  id: string;
  name: string;
  lng: number;
  lat: number;
  distanceFromStartMeters: number;
  detourMeters: number;
  isRecommended: boolean;
  hasSquat: boolean;
  hasToiletPaper: boolean;
}

export interface RouteAlert {
  type: "long_gap" | "low_density" | "detour_needed";
  message: string;
  location?: { lng: number; lat: number };
}

export interface RoutePlanResult {
  start: { name: string; lng: number; lat: number };
  end: { name: string; lng: number; lat: number };
  totalDistanceMeters: number;
  estimatedDurationMinutes: number;
  polylineEncoded: string;
  toilets: RoutePlanToilet[];
  toiletDensity: number;
  maxGapMeters: number;
  safetyScore: number;
  coverage: number;
  alerts: RouteAlert[];
}

export interface RouteSummary {
  id: string;
  name: string | null;
  startName: string;
  endName: string;
  totalDistanceMeters: number | null;
  toiletCount: number;
  safetyScore: number | null;
  isPublic: boolean;
  createdAt: string;
}

export interface RouteDetail extends RouteSummary {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  maxToiletDistanceMeters: number;
  estimatedDurationMin: number | null;
  toiletDensity: number | null;
  maxGapMeters: number | null;
  polylineEncoded: string | null;
  waypointsGeojson: unknown | null;
  shareToken: string | null;
  toilets: Array<{
    id: string;
    name: string;
    sequenceOrder: number;
    distanceFromStartMeters: number | null;
    detourMeters: number;
    isRecommended: boolean;
    toilet: {
      id: string;
      name: string;
      lat: number;
      lng: number;
      hasSquat: boolean;
      hasToiletPaper: boolean;
      avgCleanliness: number;
    };
  }>;
}
