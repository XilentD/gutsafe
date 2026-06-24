/**
 * Tests for route planner algorithm logic (pure functions).
 * Integration tests with Gaode API + DB are in the e2e suite.
 */
import { describe, it, expect } from "vitest";
import { haversineDistance } from "@/lib/coord-convert";

/**
 * Re-implement the pure functions from route-planner for testing.
 * We test the algorithm logic in isolation from DB and API.
 */

interface CoverageSample {
  index: number;
  point: [number, number];
  distance: number;
  nearestToilet?: { id: string } | null;
}

function findUncoveredSegments(
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

function computeSafetyScore(
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

describe("findUncoveredSegments", () => {
  it("should return empty when all covered", () => {
    const samples: CoverageSample[] = [
      { index: 0, distance: 100, point: [116, 39], nearestToilet: { id: "1" } },
      { index: 1, distance: 200, point: [116, 39], nearestToilet: { id: "1" } },
      { index: 2, distance: 150, point: [116, 39], nearestToilet: { id: "2" } },
    ];
    const result = findUncoveredSegments(samples, 500);
    expect(result).toHaveLength(0);
  });

  it("should find single uncovered segment", () => {
    const samples: CoverageSample[] = [
      { index: 0, distance: 100, point: [116, 39], nearestToilet: { id: "1" } },
      { index: 1, distance: 600, point: [116, 39], nearestToilet: null },
      { index: 2, distance: 700, point: [116, 39], nearestToilet: null },
      { index: 3, distance: 200, point: [116, 39], nearestToilet: { id: "2" } },
    ];
    const result = findUncoveredSegments(samples, 500);
    expect(result).toHaveLength(1);
    expect(result[0].start).toBe(1);
    expect(result[0].end).toBe(3);
  });

  it("should find multiple uncovered segments", () => {
    const samples: CoverageSample[] = [
      { index: 0, distance: 600, point: [116, 39], nearestToilet: null },
      { index: 1, distance: 100, point: [116, 39], nearestToilet: { id: "1" } },
      { index: 2, distance: 600, point: [116, 39], nearestToilet: null },
    ];
    const result = findUncoveredSegments(samples, 500);
    expect(result).toHaveLength(2);
    expect(result[0].start).toBe(0);
    expect(result[0].end).toBe(1);
    expect(result[1].start).toBe(2);
    expect(result[1].end).toBe(2);
  });

  it("should handle uncovered at the end", () => {
    const samples: CoverageSample[] = [
      { index: 0, distance: 100, point: [116, 39], nearestToilet: { id: "1" } },
      { index: 1, distance: 600, point: [116, 39], nearestToilet: null },
    ];
    const result = findUncoveredSegments(samples, 500);
    expect(result).toHaveLength(1);
    expect(result[0].start).toBe(1);
    expect(result[0].end).toBe(1);
  });
});

describe("computeSafetyScore", () => {
  it("should return 1.0 for perfect route", () => {
    const score = computeSafetyScore(
      1.0,  // 100% coverage
      0,    // no gaps
      10,   // 10 toilets per km
      500   // user tolerance
    );
    expect(score).toBeCloseTo(1.0, 1);
  });

  it("should return 0 for worst route", () => {
    const score = computeSafetyScore(
      0,    // 0% coverage
      2000, // 2km max gap
      0,    // 0 toilets
      500
    );
    expect(score).toBeCloseTo(0, 1);
  });

  it("should penalize large gaps", () => {
    const good = computeSafetyScore(0.8, 200, 3, 500);
    const bad = computeSafetyScore(0.8, 1500, 3, 500);
    expect(good).toBeGreaterThan(bad);
  });

  it("should reward high density", () => {
    const low = computeSafetyScore(0.7, 500, 1, 500);
    const high = computeSafetyScore(0.7, 500, 8, 500);
    expect(high).toBeGreaterThan(low);
  });

  it("should score ~0.5 for mediocre route", () => {
    const score = computeSafetyScore(
      0.6,  // 60% coverage
      800,  // 800m max gap
      2,    // 2 toilets per km
      500   // user tolerance
    );
    expect(score).toBeGreaterThan(0.3);
    expect(score).toBeLessThan(0.7);
  });
});

describe("haversineDistance integration", () => {
  it("should correctly measure path segments", () => {
    // Simulate a 1km path sampled every 200m
    const start = { lng: 116.397428, lat: 39.90923 };
    const end = { lng: 116.407428, lat: 39.90923 };

    const totalDist = haversineDistance(start, end);
    expect(totalDist).toBeGreaterThan(800);
    expect(totalDist).toBeLessThan(1200);

    // Midpoint should be ~half
    const midPoint = {
      lng: (start.lng + end.lng) / 2,
      lat: (start.lat + end.lat) / 2,
    };
    const distToMid = haversineDistance(start, midPoint);
    expect(distToMid).toBeCloseTo(totalDist / 2, -1); // within 10m
  });
});
