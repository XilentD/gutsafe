import { describe, it, expect } from "vitest";
import { deduplicate } from "../deduplicate";
import type { NormalizedToilet } from "../normalize";

function makeToilet(overrides: Partial<NormalizedToilet> = {}): NormalizedToilet {
  return {
    name: "公共厕所",
    lat: 39.90,
    lng: 116.40,
    address: null,
    city: "北京",
    district: null,
    hasSquat: true,
    hasSeated: false,
    hasToiletPaper: false,
    hasHandWash: true,
    hasHandicap: false,
    hasChangingTable: false,
    hasMirror: false,
    feeCents: 0,
    feeDescription: null,
    openingHours: null,
    openingHoursType: "unknown",
    dataSource: "osm",
    sourceId: "osm-1",
    rawAttributes: {},
    ...overrides,
  };
}

describe("deduplicate", () => {
  it("should return empty for empty input", () => {
    expect(deduplicate([])).toEqual([]);
  });

  it("should keep single record unchanged", () => {
    const r = makeToilet({ name: "天安门公共厕所" });
    const result = deduplicate([r]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("天安门公共厕所");
  });

  it("should merge records at same location with similar names", () => {
    const r1 = makeToilet({
      name: "王府井卫生间",
      lat: 39.91427,
      lng: 116.410718,
      hasToiletPaper: true,
      dataSource: "osm",
    });
    const r2 = makeToilet({
      name: "王府井卫生间",
      lat: 39.91427 + 0.00010, // ~11m away
      lng: 116.410718 + 0.00010,
      hasSquat: false,
      hasSeated: true,
      dataSource: "gaode",
    });

    const result = deduplicate([r1, r2]);
    // Should merge into 1 (same name + <30m)
    expect(result).toHaveLength(1);
    expect(result[0].hasToiletPaper).toBe(true); // from r1
    expect(result[0].hasSeated).toBe(true); // from r2
    expect(result[0].hasSquat).toBe(true); // OR merge: any record has it → true
    // Data source should mention both
    expect(result[0].dataSource).toContain("osm");
    expect(result[0].dataSource).toContain("gaode");
  });

  it("should NOT merge records at different locations despite same name", () => {
    const r1 = makeToilet({ name: "公共厕所", lat: 39.90, lng: 116.40 });
    const r2 = makeToilet({ name: "公共厕所", lat: 39.92, lng: 116.40 }); // ~2.2km away

    const result = deduplicate([r1, r2]);
    // Should remain separate (>30m apart)
    expect(result).toHaveLength(2);
  });

  it("should merge records within 30m even with generic names", () => {
    const r1 = makeToilet({ name: "公共厕所", lat: 39.90, lng: 116.40 });
    const r2 = makeToilet({ name: "公共厕所", lat: 39.90 + 0.00020, lng: 116.40 + 0.00020 }); // ~22m

    const result = deduplicate([r1, r2]);
    expect(result).toHaveLength(1);
  });

  it("should prefer records with more attributes as primary", () => {
    const r1 = makeToilet({
      name: "测试厕所",
      lat: 39.90,
      lng: 116.40,
      hasToiletPaper: false,
      hasSquat: false,
      openingHours: null,
      district: null,
    });
    const r2 = makeToilet({
      name: "测试厕所",
      lat: 39.90 + 0.00005,
      lng: 116.40 + 0.00005,
      hasToiletPaper: true,
      hasSquat: true,
      openingHours: "06:00-22:00",
      district: "朝阳区",
    });

    const result = deduplicate([r1, r2]);
    expect(result).toHaveLength(1);
    // The merged record should have the better data
    expect(result[0].openingHours).toBe("06:00-22:00");
    expect(result[0].district).toBe("朝阳区");
  });

  it("should handle many records with same generic name at different locations", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeToilet({
        name: "公共厕所",
        lat: 39.90 + i * 0.001, // ~111m apart each
        lng: 116.40 + i * 0.001,
      })
    );

    const result = deduplicate(records);
    // Each should be unique (far enough apart)
    expect(result).toHaveLength(100);
  });
});
