/**
 * Normalizes raw toilet records from all sources into a unified format
 * ready for database insertion via Prisma client.
 */
import type { RawToiletRecord } from "./osm";
import type { RawToiletRecord as GaodeRecord } from "./gaode";

type AnyRawToilet = RawToiletRecord | GaodeRecord;

export interface NormalizedToilet {
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  city: string;
  district: string | null;
  hasSquat: boolean;
  hasSeated: boolean;
  hasToiletPaper: boolean;
  hasHandWash: boolean;
  hasHandicap: boolean;
  hasChangingTable: boolean;
  hasMirror: boolean;
  feeCents: number;
  feeDescription: string | null;
  openingHours: string | null;
  openingHoursType: "24h" | "scheduled" | "unknown";
  dataSource: string;
  sourceId: string;
  rawAttributes: Record<string, unknown>;
}

function safeTrim(val: unknown): string | null {
  return typeof val === "string" ? val.trim() || null : null;
}

export function normalize(records: AnyRawToilet[]): NormalizedToilet[] {
  return records.map((r) => ({
    name: safeTrim(r.name) || "公共厕所",
    lat: r.lat,
    lng: r.lng,
    address: safeTrim(r.address),
    city: safeTrim(r.city) || "北京",
    district: safeTrim(r.district),
    hasSquat: r.hasSquat,
    hasSeated: r.hasSeated,
    hasToiletPaper: r.hasToiletPaper,
    hasHandWash: r.hasHandWash,
    hasHandicap: r.hasHandicap,
    hasChangingTable: r.hasChangingTable,
    hasMirror: r.hasMirror,
    feeCents: r.feeCents,
    feeDescription: r.feeDescription,
    openingHours: r.openingHours,
    openingHoursType: r.openingHoursType,
    dataSource: r.dataSource,
    sourceId: r.sourceId,
    rawAttributes: {
      originalName: r.name,
      rawTags: r.rawTags || {},
    },
  }));
}
