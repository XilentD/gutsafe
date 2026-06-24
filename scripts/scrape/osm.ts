/**
 * OSM Overpass API scraper for public toilets.
 * Queries OpenStreetMap for amenity=toilets nodes in a given city.
 *
 * Usage: npx tsx scripts/scrape/osm.ts --city "北京"
 */
import fs from "fs";
import path from "path";

const OVERPASS_URL = process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter";

// Approximate bounding boxes for major Chinese cities (WGS-84)
const CITY_BBOXES: Record<string, { south: number; west: number; north: number; east: number }> = {
  "北京": { south: 39.44, west: 115.42, north: 40.04, east: 117.50 },
  "上海": { south: 30.68, west: 120.85, north: 31.53, east: 122.00 },
  "广州": { south: 22.55, west: 112.95, north: 23.58, east: 113.98 },
  "深圳": { south: 22.45, west: 113.77, north: 22.84, east: 114.62 },
  "成都": { south: 30.08, west: 103.60, north: 30.98, east: 104.55 },
  "杭州": { south: 29.93, west: 119.72, north: 30.58, east: 120.67 },
  "武汉": { south: 30.10, west: 113.68, north: 30.98, east: 114.77 },
  "南京": { south: 31.62, west: 118.35, north: 32.37, east: 119.25 },
  "珠海": { south: 22.00, west: 113.25, north: 22.44, east: 114.15 },
  "佛山": { south: 22.88, west: 112.80, north: 23.40, east: 113.30 },
  "东莞": { south: 22.80, west: 113.50, north: 23.20, east: 114.25 },
  "惠州": { south: 22.65, west: 114.05, north: 23.45, east: 114.85 },
  "中山": { south: 22.30, west: 113.25, north: 22.80, east: 113.55 },
  "汕头": { south: 23.20, west: 116.50, north: 23.60, east: 116.90 },
  "湛江": { south: 20.90, west: 109.70, north: 21.75, east: 110.90 },
  "茂名": { south: 21.30, west: 110.60, north: 22.15, east: 111.65 },
  "阳江": { south: 21.55, west: 111.60, north: 22.20, east: 112.35 },
  "肇庆": { south: 22.90, west: 111.80, north: 23.70, east: 112.85 },
  "云浮": { south: 22.60, west: 111.40, north: 23.20, east: 112.30 },
};

interface RawOsmElement {
  type: "node" | "way";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: RawOsmElement[];
}

export interface RawToiletRecord {
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
  dataSource: "osm";
  sourceId: string;
  rawTags: Record<string, string>;
}

function buildQuery(city: string): string {
  const bbox = CITY_BBOXES[city];
  if (!bbox) throw new Error(`Unknown city: ${city}. Add bbox to CITY_BBOXES.`);

  const { south, west, north, east } = bbox;

  return `[out:json][timeout:120];
(
  node["amenity"="toilets"](${south},${west},${north},${east});
  way["amenity"="toilets"](${south},${west},${north},${east});
);
out center meta tags;`;
}

function parseFee(tags: Record<string, string>): { feeCents: number; feeDescription: string | null } {
  const fee = tags["fee"]?.toLowerCase();
  if (fee === "no" || fee === "0" || !fee) {
    return { feeCents: 0, feeDescription: null };
  }
  if (fee === "yes") {
    const charge = tags["charge"];
    if (charge) {
      const match = charge.match(/([\d.]+)\s*(CNY|RMB|元)/);
      if (match) {
        return { feeCents: Math.round(parseFloat(match[1]) * 100), feeDescription: charge };
      }
    }
    return { feeCents: 50, feeDescription: "收费" }; // default assumption
  }
  const numeric = parseFloat(fee);
  if (!isNaN(numeric)) {
    return { feeCents: Math.round(numeric * 100), feeDescription: `${numeric}元` };
  }
  return { feeCents: 0, feeDescription: null };
}

function parseOpeningHours(tags: Record<string, string>): { openingHours: string | null; openingHoursType: "24h" | "scheduled" | "unknown" } {
  const hours = tags["opening_hours"];
  if (!hours) return { openingHours: null, openingHoursType: "unknown" };
  if (hours === "24/7" || hours === "Mo-Su 00:00-24:00" || hours === "00:00-24:00") {
    return { openingHours: hours, openingHoursType: "24h" };
  }
  return { openingHours: hours, openingHoursType: "scheduled" };
}

function normalizeElement(el: RawOsmElement, city: string): RawToiletRecord | null {
  const tags = el.tags || {};
  const name = tags["name"] || tags["name:zh"] || tags["name:en"] || "公共厕所";
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;

  if (lat === undefined || lng === undefined) return null;

  const { feeCents, feeDescription } = parseFee(tags);
  const { openingHours, openingHoursType } = parseOpeningHours(tags);

  return {
    name: name.substring(0, 300),
    lat,
    lng,
    address: tags["addr:full"] || tags["addr:street"] || null,
    city,
    district: tags["addr:district"] || null,
    hasSquat: tags["toilets:position"] === "squat" || tags["squat"] === "yes",
    hasSeated: tags["toilets:position"] === "seated" || tags["seated"] === "yes" || true, // default
    hasToiletPaper: tags["toilets:paper_supplied"] === "yes" || tags["toilet_paper"] === "yes",
    hasHandWash: tags["hand_washing"] !== "no",
    hasHandicap: tags["wheelchair"] === "yes" || tags["accessible"] === "yes",
    hasChangingTable: tags["changing_table"] === "yes" || tags["baby_care"] === "yes",
    hasMirror: tags["mirror"] === "yes",
    feeCents,
    feeDescription,
    openingHours,
    openingHoursType,
    dataSource: "osm",
    sourceId: `osm-${el.type}-${el.id}`,
    rawTags: tags,
  };
}

export async function scrapeOsm(city: string): Promise<RawToiletRecord[]> {
  console.log(`🔍 Querying OSM Overpass for ${city}...`);
  const query = buildQuery(city);

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
      "User-Agent": "OPC-WC-Scraper/0.1",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    throw new Error(`Overpass API error: ${res.status} ${res.statusText}`);
  }

  const data: OverpassResponse = await res.json();
  console.log(`   Received ${data.elements.length} raw elements`);

  const records: RawToiletRecord[] = [];
  for (const el of data.elements) {
    const record = normalizeElement(el, city);
    if (record) records.push(record);
  }

  console.log(`   Normalized ${records.length} toilet records`);
  return records;
}

// CLI entry — only runs when executed directly
if (process.argv[1]?.includes("osm")) {
  (async () => {
    const args = process.argv.slice(2);
    const cityArg = args.find((a) => a.startsWith("--city="));
    const city = cityArg?.split("=")[1] || "北京";

    console.log(`📍 Scraping OSM toilets for: ${city}`);
    const records = await scrapeOsm(city);

    const outputDir = path.join(process.cwd(), "data", "raw");
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `osm-${city}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
    console.log(`💾 Saved ${records.length} records to ${outputPath}`);
  })().catch(console.error);
}
