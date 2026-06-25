import { describe, it, expect } from "vitest";

/**
 * Tests for ToiletMap core logic (pure functions and state transitions).
 * The component itself requires AMap SDK and browser APIs,
 * so we test the logic in isolation.
 */

// ── Position fallback logic ──

function shouldFallbackToCityPicker(location: { lng: number; lat: number }): boolean {
  // If location is within ~5km of Beijing Tiananmen default center
  return (
    Math.abs(location.lat - 39.909) < 0.05 &&
    Math.abs(location.lng - 116.397) < 0.05
  );
}

// ── Progressive radius search ──

const SEARCH_RADII = [5000, 20000, 100000];

function selectSearchRadius(
  attempts: number,
  hasResults: boolean
): number | null {
  if (attempts >= SEARCH_RADII.length) return null;
  return SEARCH_RADII[attempts];
}

// ── NaN coordinate guards ──

function isValidCoordinate(value: number): boolean {
  return Number.isFinite(value);
}

function isValidLocation(loc: { lng: number; lat: number }): boolean {
  return isValidCoordinate(loc.lng) && isValidCoordinate(loc.lat);
}

// ── Default center detection ──

const BEIJING_CENTER = { lng: 116.397428, lat: 39.90923 };
const BEIJING_TOLERANCE = 0.03; // ~3km

function isDefaultBeijingCenter(loc: { lng: number; lat: number }): boolean {
  return (
    Math.abs(loc.lat - BEIJING_CENTER.lat) < BEIJING_TOLERANCE &&
    Math.abs(loc.lng - BEIJING_CENTER.lng) < BEIJING_TOLERANCE
  );
}

describe("position fallback logic", () => {
  it("should detect default Beijing center", () => {
    expect(shouldFallbackToCityPicker({ lng: 116.4, lat: 39.91 })).toBe(true);
    expect(shouldFallbackToCityPicker({ lng: 116.397, lat: 39.909 })).toBe(true);
  });

  it("should NOT fallback for non-Beijing locations", () => {
    expect(shouldFallbackToCityPicker({ lng: 113.26, lat: 23.13 })).toBe(false); // Guangzhou
    expect(shouldFallbackToCityPicker({ lng: 121.47, lat: 31.23 })).toBe(false); // Shanghai
    expect(shouldFallbackToCityPicker({ lng: 110.64, lat: 21.66 })).toBe(false); // Maoming
  });

  it("should detect edge of tolerance", () => {
    // Just outside tolerance (>0.05 degrees ≈ 5km)
    expect(shouldFallbackToCityPicker({ lng: 116.45, lat: 39.97 })).toBe(false);
    // Just inside
    expect(shouldFallbackToCityPicker({ lng: 116.44, lat: 39.95 })).toBe(true);
  });
});

describe("progressive radius search", () => {
  it("should return first radius on first attempt", () => {
    expect(selectSearchRadius(0, false)).toBe(5000);
  });

  it("should advance to larger radius when no results", () => {
    expect(selectSearchRadius(1, false)).toBe(20000);
    expect(selectSearchRadius(2, false)).toBe(100000);
  });

  it("should return null when all radii exhausted", () => {
    expect(selectSearchRadius(3, false)).toBeNull();
  });

  it("should return correct radii regardless of results flag", () => {
    expect(selectSearchRadius(0, true)).toBe(5000);
    expect(selectSearchRadius(0, false)).toBe(5000);
  });
});

describe("NaN coordinate guards", () => {
  it("should accept valid coordinates", () => {
    expect(isValidCoordinate(116.4)).toBe(true);
    expect(isValidCoordinate(-23.1)).toBe(true);
    expect(isValidCoordinate(0)).toBe(true);
    expect(isValidCoordinate(180)).toBe(true);
  });

  it("should reject NaN", () => {
    expect(isValidCoordinate(NaN)).toBe(false);
  });

  it("should reject Infinity", () => {
    expect(isValidCoordinate(Infinity)).toBe(false);
    expect(isValidCoordinate(-Infinity)).toBe(false);
  });

  it("should validate location pairs", () => {
    expect(isValidLocation({ lng: 116.4, lat: 39.9 })).toBe(true);
    expect(isValidLocation({ lng: NaN, lat: 39.9 })).toBe(false);
    expect(isValidLocation({ lng: 116.4, lat: Infinity })).toBe(false);
    expect(isValidLocation({ lng: NaN, lat: NaN })).toBe(false);
  });
});

describe("default Beijing center detection", () => {
  it("should detect exact Beijing center", () => {
    expect(isDefaultBeijingCenter(BEIJING_CENTER)).toBe(true);
  });

  it("should detect near Beijing center", () => {
    const near = { lng: 116.4, lat: 39.91 };
    expect(isDefaultBeijingCenter(near)).toBe(true);
  });

  it("should NOT detect locations in other cities", () => {
    const guangzhou = { lng: 113.264385, lat: 23.12911 };
    const shanghai = { lng: 121.473701, lat: 31.230416 };
    const chengdu = { lng: 104.065735, lat: 30.659862 };
    expect(isDefaultBeijingCenter(guangzhou)).toBe(false);
    expect(isDefaultBeijingCenter(shanghai)).toBe(false);
    expect(isDefaultBeijingCenter(chengdu)).toBe(false);
  });

  it("should detect user slightly west of Beijing", () => {
    const westBeijing = { lng: 116.38, lat: 39.92 };
    expect(isDefaultBeijingCenter(westBeijing)).toBe(true);
  });
});
