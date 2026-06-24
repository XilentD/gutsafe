/**
 * Spatial deduplication for toilet records.
 * Groups toilets within 30m of each other, then matches by name similarity.
 * Merges attributes from all sources, preferring verified data.
 */
import { haversineDistance } from "../../src/lib/coord-convert";
import type { NormalizedToilet } from "./normalize";

interface DedupGroup {
  records: NormalizedToilet[];
  merged: NormalizedToilet;
}

function nameSimilarity(a: string, b: string): number {
  // Simple: if one contains the other, or Levenshtein-like check
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;

  if (longer.includes(shorter) || shorter.includes(longer)) return 1.0;

  // Simple Jaccard on character bigrams
  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) {
      set.add(s.substring(i, i + 2));
    }
    return set;
  };

  const aSet = bigrams(a);
  const bSet = bigrams(b);
  const intersection = new Set([...aSet].filter((x) => bSet.has(x)));
  const union = new Set([...aSet, ...bSet]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

function mergeGroup(group: NormalizedToilet[]): NormalizedToilet {
  if (group.length === 1) return group[0];

  // Prefer records with more filled-in attributes
  const sorted = [...group].sort((a, b) => {
    const scoreA =
      (a.hasSquat ? 1 : 0) +
      (a.hasToiletPaper ? 1 : 0) +
      (a.hasHandicap ? 1 : 0) +
      (a.openingHours ? 1 : 0) +
      (a.feeDescription ? 1 : 0) +
      (a.district ? 1 : 0) +
      (a.address ? 1 : 0);
    const scoreB =
      (b.hasSquat ? 1 : 0) +
      (b.hasToiletPaper ? 1 : 0) +
      (b.hasHandicap ? 1 : 0) +
      (b.openingHours ? 1 : 0) +
      (b.feeDescription ? 1 : 0) +
      (b.district ? 1 : 0) +
      (b.address ? 1 : 0);
    return scoreB - scoreA;
  });

  // Merge: take truthy values from any record (OR logic for amenities)
  const merged: NormalizedToilet = {
    ...sorted[0],
    hasSquat: group.some((r) => r.hasSquat),
    hasSeated: group.some((r) => r.hasSeated),
    hasToiletPaper: group.some((r) => r.hasToiletPaper),
    hasHandWash: group.some((r) => r.hasHandWash),
    hasHandicap: group.some((r) => r.hasHandicap),
    hasChangingTable: group.some((r) => r.hasChangingTable),
    hasMirror: group.some((r) => r.hasMirror),
    openingHours: sorted.find((r) => r.openingHours)?.openingHours || null,
    openingHoursType: sorted.find((r) => r.openingHoursType !== "unknown")?.openingHoursType || "unknown",
    feeCents: Math.max(...group.map((r) => r.feeCents)),
    feeDescription: sorted.find((r) => r.feeDescription)?.feeDescription || null,
    district: sorted.find((r) => r.district)?.district || null,
    address: sorted.find((r) => r.address)?.address || null,
    dataSource: [...new Set(group.map((r) => r.dataSource))].join(","),
    sourceId: sorted[0].sourceId,
    rawAttributes: {
      sources: group.map((r) => r.dataSource),
      mergedCount: group.length,
      allRaw: group.map((r) => r.rawAttributes),
    },
  };

  return merged;
}

export function deduplicate(records: NormalizedToilet[]): NormalizedToilet[] {
  if (records.length === 0) return [];

  console.log(`   Deduplicating ${records.length} records...`);

  // 1. Spatial grouping within 30m
  const groups: NormalizedToilet[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < records.length; i++) {
    if (assigned.has(i)) continue;

    const group: NormalizedToilet[] = [records[i]];
    assigned.add(i);

    for (let j = i + 1; j < records.length; j++) {
      if (assigned.has(j)) continue;

      const dist = haversineDistance(
        { lng: records[i].lng, lat: records[i].lat },
        { lng: records[j].lng, lat: records[j].lat }
      );

      if (dist <= 30) {
        // Within 30m — check name similarity
        const sim = nameSimilarity(records[i].name, records[j].name);
        if (sim >= 0.3) {
          group.push(records[j]);
          assigned.add(j);
        }
      }
    }

    groups.push(group);
  }

  console.log(`   Formed ${groups.length} spatial groups`);

  // 2. Merge each group
  const merged = groups.map(mergeGroup);
  console.log(`   Merged to ${merged.length} unique toilets`);

  return merged;
}
