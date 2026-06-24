import { describe, it, expect } from "vitest";
import {
  wgs84ToGcj02,
  gcj02ToWgs84,
  haversineDistance,
  bd09ToWgs84,
  wgs84ToBd09,
} from "../coord-convert";

describe("coord-convert", () => {
  describe("wgs84ToGcj02", () => {
    it("should convert WGS-84 to GCJ-02 (Tiananmen)", () => {
      const wgs = { lng: 116.397428, lat: 39.90923 };
      const gcj = wgs84ToGcj02(wgs);
      // GCJ-02 should be offset by ~100-700m in China
      expect(gcj.lng).toBeGreaterThan(wgs.lng);
      expect(gcj.lat).toBeGreaterThan(wgs.lat);
      // Offset should be reasonable (100-700m)
      const dist = haversineDistance(wgs, gcj);
      expect(dist).toBeGreaterThan(100);
      expect(dist).toBeLessThan(1000);
    });

    it("should produce small offset outside China", () => {
      // Tokyo — outside China, offset should be minimal
      const wgs = { lng: 139.6917, lat: 35.6895 };
      const gcj = wgs84ToGcj02(wgs);
      const dist = haversineDistance(wgs, gcj);
      // Outside China, offset is minimal
      expect(dist).toBeLessThan(10);
    });
  });

  describe("gcj02ToWgs84", () => {
    it("should round-trip correctly", () => {
      const original = { lng: 116.397428, lat: 39.90923 };
      const gcj = wgs84ToGcj02(original);
      const back = gcj02ToWgs84(gcj);
      const dist = haversineDistance(original, back);
      // Round-trip should be within 5 meters
      expect(dist).toBeLessThan(5);
    });
  });

  describe("bd09ToWgs84", () => {
    it("should convert BD-09 back to WGS-84", () => {
      const bd = { lng: 116.404, lat: 39.915 };
      const wgs = bd09ToWgs84(bd);
      // WGS-84 should be valid coordinates
      expect(wgs.lng).toBeGreaterThan(115);
      expect(wgs.lng).toBeLessThan(118);
      expect(wgs.lat).toBeGreaterThan(39);
      expect(wgs.lat).toBeLessThan(41);
    });
  });

  describe("wgs84ToBd09", () => {
    it("should convert to BD-09 and back", () => {
      const original = { lng: 116.397428, lat: 39.90923 };
      const bd = wgs84ToBd09(original);
      const back = bd09ToWgs84(bd);
      const dist = haversineDistance(original, back);
      expect(dist).toBeLessThan(5);
    });
  });
});

describe("haversineDistance", () => {
  it("should return 0 for same point", () => {
    const p = { lng: 116.397, lat: 39.909 };
    expect(haversineDistance(p, p)).toBe(0);
  });

  it("should compute distance between Tiananmen and Wangfujing", () => {
    const tiananmen = { lng: 116.397428, lat: 39.90923 };
    const wangfujing = { lng: 116.410718, lat: 39.91427 };
    const dist = haversineDistance(tiananmen, wangfujing);
    // Actual distance is ~1.2 km
    expect(dist).toBeGreaterThan(1000);
    expect(dist).toBeLessThan(1500);
  });

  it("should compute long distance (Beijing → Shanghai)", () => {
    const beijing = { lng: 116.4074, lat: 39.9042 };
    const shanghai = { lng: 121.4737, lat: 31.2304 };
    const dist = haversineDistance(beijing, shanghai);
    // ~1068 km
    expect(dist).toBeGreaterThan(1_000_000);
    expect(dist).toBeLessThan(1_200_000);
  });

  it("should be symmetric", () => {
    const a = { lng: 116.397, lat: 39.909 };
    const b = { lng: 121.474, lat: 31.230 };
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 0);
  });

  it("should satisfy triangle inequality", () => {
    const a = { lng: 116, lat: 39 };
    const b = { lng: 117, lat: 39 };
    const c = { lng: 116.5, lat: 39.5 };
    const ab = haversineDistance(a, b);
    const ac = haversineDistance(a, c);
    const cb = haversineDistance(c, b);
    expect(ab).toBeLessThanOrEqual(ac + cb + 1); // 1m tolerance
  });
});
