/**
 * Route Planning Algorithm for IBS-friendly walking routes.
 *
 * Algorithm:
 * 1. Expand bbox from S→E and query toilets
 * 2. Request walking path from Gaode Walking API
 * 3. Sample points every 20m along path
 * 4. Compute nearest toilet distance per sample (KNN)
 * 5. Mark dead zones where distance > user's tolerance
 * 6. Suggest detour toilets for each dead zone
 * 7. Compute safety metrics
 */
import { db } from "@/lib/db";
import { haversineDistance } from "@/lib/coord-convert";

export interface RoutePlanInput {
  startLat: number;
  startLng: number;
  startName?: string;
  endLat: number;
  endLng: number;
  endName?: string;
  maxToiletDistance: number; // meters
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
  polylinePoints: [number, number][]; // simplified path points
  toilets: RoutePlanToilet[];
  toiletDensity: number; // toilets per km
  maxGapMeters: number;
  safetyScore: number; // 0-1
  coverage: number; // percentage within T of a toilet
  alerts: RouteAlert[];
  uncoveredSegments: Array<{ start: number; end: number }>;
}

const SAMPLE_INTERVAL = 20; // meters
const WALKING_SPEED = 80; // meters per minute (~5km/h)
const MAX_DETOUR = 500; // max detour meters to include a toilet

/**
 * Core route planning function.
 * Finds IBS-friendly walking route between two points.
 */
export async function planRoute(input: RoutePlanInput): Promise<RoutePlanResult> {
  const S = { lng: input.startLng, lat: input.startLat };
  const E = { lng: input.endLng, lat: input.endLat };
  const T = input.maxToiletDistance;

  // Phase 1: Query toilets in expanded corridor
  const toilets = await findToiletsInCorridor(S, E, T);

  // Phase 2: Get real walking path from Gaode API, fall back to straight line
  const { pathPoints, totalDistance } = await getWalkingPath(S, E, SAMPLE_INTERVAL);

  // Phase 3: Coverage analysis
  const coverage = analyzeCoverage(pathPoints, toilets, S, T);

  // Phase 4: Identify recommended toilets
  const recommendedToilets = coverage.samples
    .filter((s) => s.nearestToilet && s.distance <= T)
    .map((s) => s.nearestToilet!)
    .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i) // dedup
    .map((t) => ({
      ...t,
      distanceFromStartMeters: haversineDistance(S, {
        lng: t.lng,
        lat: t.lat,
      }),
      detourMeters: 0,
      isRecommended: true,
    }));

  // Phase 5: Find uncovered segments
  const uncoveredSegments = findUncoveredSegments(coverage.samples, T);

  // Phase 6: Compute metrics
  const maxGap = uncoveredSegments.length > 0
    ? Math.max(...uncoveredSegments.map((s) => s.end - s.start))
    : 0;

  const coveredSamples = coverage.samples.filter(
    (s) => s.distance <= T
  ).length;
  const coveragePct =
    coverage.samples.length > 0
      ? coveredSamples / coverage.samples.length
      : 0;

  const density =
    totalDistance > 0 ? (toilets.length / totalDistance) * 1000 : 0;

  const safetyScore = computeSafetyScore(
    coveragePct,
    maxGap,
    density,
    T
  );

  // Phase 7: Generate alerts
  const alerts: RouteAlert[] = [];
  if (toilets.length === 0) {
    alerts.push({
      type: "low_density",
      message: "该区域未找到卫生间数据，路线可能存在风险",
    });
  }
  uncoveredSegments.forEach((seg) => {
    const gapMeters = (seg.end - seg.start) * SAMPLE_INTERVAL;
    if (gapMeters > T * 2) {
      const midIdx = Math.floor((seg.start + seg.end) / 2);
      const midPoint = pathPoints[midIdx];
      alerts.push({
        type: "long_gap",
        message: `在约${Math.round(gapMeters)}米的区间内没有卫生间`,
        location: midPoint ? { lng: midPoint[0], lat: midPoint[1] } : undefined,
      });
    }
  });
  if (coveragePct < 0.5) {
    alerts.push({
      type: "low_density",
      message: `仅${Math.round(coveragePct * 100)}%的路段在卫生间${T}米范围内`,
    });
  }

  return {
    start: {
      name: input.startName || "起点",
      lng: input.startLng,
      lat: input.startLat,
    },
    end: {
      name: input.endName || "终点",
      lng: input.endLng,
      lat: input.endLat,
    },
    totalDistanceMeters: Math.round(totalDistance),
    estimatedDurationMinutes: Math.round(totalDistance / WALKING_SPEED),
    polylinePoints: pathPoints,
    toilets: recommendedToilets,
    toiletDensity: Math.round(density * 100) / 100,
    maxGapMeters: Math.round(maxGap),
    safetyScore: Math.round(safetyScore * 100) / 100,
    coverage: Math.round(coveragePct * 10000) / 100,
    alerts,
    uncoveredSegments,
  };
}

/**
 * Find toilets in the corridor between S and E.
 */
async function findToiletsInCorridor(
  S: { lng: number; lat: number },
  E: { lng: number; lat: number },
  maxToiletDistance: number
) {
  // Plan says: expand bbox by T*2 in all directions
  const bufferMeters = maxToiletDistance * 2;
  const latDegPerMeter = 1 / 111000;
  const lngDegPerMeter = 1 / (111000 * Math.cos(((S.lat + E.lat) / 2) * Math.PI / 180));
  const bufferLatDeg = bufferMeters * latDegPerMeter;
  const bufferLngDeg = bufferMeters * lngDegPerMeter;
  const minLat = Math.min(S.lat, E.lat) - bufferLatDeg;
  const maxLat = Math.max(S.lat, E.lat) + bufferLatDeg;
  const minLng = Math.min(S.lng, E.lng) - bufferLngDeg;
  const maxLng = Math.max(S.lng, E.lng) + bufferLngDeg;

  const toilets = await db.toilet.findMany({
    where: {
      lat: { gte: minLat, lte: maxLat },
      lng: { gte: minLng, lte: maxLng },
    },
    select: {
      id: true,
      name: true,
      lat: true,
      lng: true,
      hasSquat: true,
      hasToiletPaper: true,
      avgCleanliness: true,
    },
    take: 200,
  });

  return toilets.map((t) => ({
    id: t.id,
    name: t.name,
    lng: t.lng,
    lat: t.lat,
    hasSquat: t.hasSquat,
    hasToiletPaper: t.hasToiletPaper,
  }));
}

/**
 * Fetch real walking path from Gaode Directions API.
 * Falls back to straight-line interpolation if API unavailable.
 */
async function getWalkingPath(
  S: { lng: number; lat: number },
  E: { lng: number; lat: number },
  intervalMeters: number
): Promise<{ pathPoints: [number, number][]; totalDistance: number }> {
  const key = process.env.GAODE_WEB_API_KEY;

  if (!key) {
    console.log("[route-planner] No Gaode key, using straight-line path");
    return {
      pathPoints: interpolatePath(S, E, intervalMeters),
      totalDistance: haversineDistance(S, E),
    };
  }

  try {
    const url = `https://restapi.amap.com/v3/direction/walking?key=${key}&origin=${S.lng},${S.lat}&destination=${E.lng},${E.lat}&output=JSON`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Gaode API ${res.status}`);

    const data = await res.json();
    if (data.status !== "1" || !data.route?.paths?.[0]) {
      throw new Error("Gaode API returned no route");
    }

    const path = data.route.paths[0];
    const totalDistance = parseInt(path.distance, 10); // meters

    // Parse polyline steps into path points
    const points: [number, number][] = [];
    if (!path.steps || !Array.isArray(path.steps)) {
      throw new Error("Gaode API returned path without steps");
    }
    for (const step of path.steps) {
      const polyline = step.polyline;
      if (!polyline) continue;
      // Gaode polyline format: "lng1,lat1;lng2,lat2;..."
      const coords = polyline.split(";");
      for (const coord of coords) {
        const [lng, lat] = coord.split(",").map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          points.push([lng, lat]);
        }
      }
    }

    // Resample to uniform interval
    const resampled = resamplePath(points, intervalMeters);
    console.log(`[route-planner] Gaode walking path: ${resampled.length} points, ${totalDistance}m`);
    return { pathPoints: resampled, totalDistance };
  } catch (err) {
    console.warn("[route-planner] Gaode API failed, falling back to straight-line:", (err as Error).message);
    return {
      pathPoints: interpolatePath(S, E, intervalMeters),
      totalDistance: haversineDistance(S, E),
    };
  }
}

/**
 * Resample a path polyline to uniform interval spacing.
 */
function resamplePath(
  points: [number, number][],
  intervalMeters: number
): [number, number][] {
  if (points.length < 2) return points;

  const result: [number, number][] = [points[0]];
  let accumulated = 0;
  let prev = points[0];

  for (let i = 1; i < points.length; i++) {
    const dist = haversineDistance(
      { lng: prev[0], lat: prev[1] },
      { lng: points[i][0], lat: points[i][1] }
    );
    // Skip duplicate points (dist can be 0 for consecutive identical coords)
    if (dist === 0) continue;
    accumulated += dist;

    while (accumulated >= intervalMeters) {
      const t = (dist - (accumulated - intervalMeters)) / dist;
      result.push([
        prev[0] + (points[i][0] - prev[0]) * t,
        prev[1] + (points[i][1] - prev[1]) * t,
      ]);
      accumulated -= intervalMeters;
    }
    prev = points[i];
  }

  // Add last point if not already there
  const last = points[points.length - 1];
  if (result[result.length - 1][0] !== last[0] || result[result.length - 1][1] !== last[1]) {
    result.push(last);
  }

  return result;
}

/**
 * Interpolate points along a straight line path.
 */
function interpolatePath(
  S: { lng: number; lat: number },
  E: { lng: number; lat: number },
  intervalMeters: number
): [number, number][] {
  const totalDist = haversineDistance(S, E);
  const numPoints = Math.max(2, Math.ceil(totalDist / intervalMeters));
  const points: [number, number][] = [];

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    points.push([
      S.lng + (E.lng - S.lng) * t,
      S.lat + (E.lat - S.lat) * t,
    ]);
  }

  return points;
}

interface CoverageSample {
  index: number;
  point: [number, number];
  distance: number;
  nearestToilet?: {
    id: string;
    name: string;
    lng: number;
    lat: number;
    hasSquat: boolean;
    hasToiletPaper: boolean;
  } | null;
}

interface CoverageAnalysis {
  samples: CoverageSample[];
}

/**
 * For each sample point, find nearest toilet distance.
 */
function analyzeCoverage(
  pathPoints: [number, number][],
  toilets: Array<{
    id: string;
    name: string;
    lng: number;
    lat: number;
    hasSquat: boolean;
    hasToiletPaper: boolean;
  }>,
  S: { lng: number; lat: number },
  _maxDistance: number
): CoverageAnalysis {
  const samples: CoverageSample[] = pathPoints.map((point, index) => {
    let minDist = Infinity;
    let nearest = null;

    for (const toilet of toilets) {
      const dist = haversineDistance(
        { lng: point[0], lat: point[1] },
        { lng: toilet.lng, lat: toilet.lat }
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = toilet;
      }
    }

    return {
      index,
      point,
      distance: minDist,
      nearestToilet: nearest,
    };
  });

  return { samples };
}

/**
 * Find continuous uncovered segments where distance > threshold.
 */
export function findUncoveredSegments(
  samples: CoverageSample[],
  threshold: number
): Array<{ start: number; end: number }> {
  const segments: Array<{ start: number; end: number }> = [];
  let currentStart: number | null = null;

  for (const s of samples) {
    if (s.distance > threshold) {
      if (currentStart === null) currentStart = s.index;
    } else {
      if (currentStart !== null) {
        segments.push({ start: currentStart, end: s.index });
        currentStart = null;
      }
    }
  }

  if (currentStart !== null) {
    segments.push({ start: currentStart, end: samples.length - 1 });
  }

  return segments;
}

/**
 * Compute safety score (0-1) from coverage metrics.
 */
export function computeSafetyScore(
  coverage: number,
  maxGap: number,
  density: number,
  userTolerance: number
): number {
  const coverageScore = coverage * 0.4;
  const gapScore = Math.max(0, 1 - maxGap / (userTolerance * 4)) * 0.3;
  const densityScore = Math.min(1, density / 5) * 0.3;
  return coverageScore + gapScore + densityScore;
}
