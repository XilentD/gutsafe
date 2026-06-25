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
  // 华北
  "天津": { south: 38.55, west: 116.70, north: 40.25, east: 118.10 },
  "石家庄": { south: 37.80, west: 114.20, north: 38.30, east: 114.80 },
  "太原": { south: 37.55, west: 112.15, north: 38.15, east: 112.85 },
  "呼和浩特": { south: 40.50, west: 111.40, north: 40.95, east: 111.95 },
  // 东北
  "沈阳": { south: 41.50, west: 123.10, north: 42.10, east: 123.80 },
  "大连": { south: 38.70, west: 121.30, north: 39.10, east: 121.85 },
  "长春": { south: 43.60, west: 125.00, north: 44.10, east: 125.55 },
  "哈尔滨": { south: 45.50, west: 126.30, north: 45.95, east: 126.95 },
  // 华东
  "苏州": { south: 31.15, west: 120.30, north: 31.50, east: 120.90 },
  "宁波": { south: 29.70, west: 121.30, north: 30.00, east: 121.85 },
  "合肥": { south: 31.60, west: 117.00, north: 32.05, east: 117.55 },
  "福州": { south: 25.95, west: 119.10, north: 26.35, east: 119.55 },
  "厦门": { south: 24.35, west: 117.90, north: 24.65, east: 118.30 },
  "南昌": { south: 28.55, west: 115.70, north: 28.85, east: 116.15 },
  "济南": { south: 36.50, west: 116.80, north: 36.85, east: 117.20 },
  "青岛": { south: 35.95, west: 120.10, north: 36.35, east: 120.65 },
  // 华中
  "郑州": { south: 34.60, west: 113.40, north: 34.95, east: 113.95 },
  "长沙": { south: 28.05, west: 112.80, north: 28.40, east: 113.15 },
  // 西南
  "重庆": { south: 29.30, west: 106.20, north: 29.80, east: 106.80 },
  "贵阳": { south: 26.40, west: 106.50, north: 26.80, east: 106.95 },
  "昆明": { south: 24.90, west: 102.50, north: 25.20, east: 102.95 },
  "拉萨": { south: 29.55, west: 90.95, north: 29.75, east: 91.30 },
  // 西北
  "西安": { south: 34.10, west: 108.75, north: 34.45, east: 109.15 },
  "兰州": { south: 35.95, west: 103.50, north: 36.25, east: 104.00 },
  "西宁": { south: 36.50, west: 101.55, north: 36.80, east: 101.95 },
  "银川": { south: 38.35, west: 106.05, north: 38.60, east: 106.50 },
  "乌鲁木齐": { south: 43.65, west: 87.40, north: 44.00, east: 87.80 },
  // 华南
  "南宁": { south: 22.65, west: 108.10, north: 22.95, east: 108.55 },
  "桂林": { south: 25.20, west: 110.10, north: 25.45, east: 110.50 },
  "海口": { south: 19.90, west: 110.15, north: 20.10, east: 110.50 },
  "三亚": { south: 18.15, west: 109.35, north: 18.35, east: 109.65 },
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
