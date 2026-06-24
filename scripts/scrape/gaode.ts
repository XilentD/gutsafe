/**
 * Gaode (高德) POI API scraper for public toilets.
 * Uses the Gaode Place API to search for 公共厕所 in a given city.
 * Coordinates are returned in GCJ-02; converted to WGS-84.
 *
 * Usage: npx tsx scripts/scrape/gaode.ts --city "北京"
 */
import fs from "fs";
import path from "path";
import { gcj02ToWgs84 } from "../../src/lib/coord-convert";

const GAODE_KEY = process.env.GAODE_WEB_API_KEY || "";
const GAODE_PLACE_URL = "https://restapi.amap.com/v3/place/text";

// City codes for Gaode API
const CITY_CODES: Record<string, string> = {
  "北京": "110000",
  "上海": "310000",
  "广州": "440100",
  "深圳": "440300",
  "成都": "510100",
  "杭州": "330100",
  "武汉": "420100",
  "南京": "320100",
};

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
  dataSource: "gaode";
  sourceId: string;
  rawTags: Record<string, string>;
}

interface GaodePOI {
  id: string;
  name: string;
  location: string; // "lng,lat" in GCJ-02
  address: string;
  adname: string; // district
  biz_ext?: {
    cost?: string;
    rating?: string;
  };
  deep_info?: {
    opentime?: string;
  };
}

interface GaodeResponse {
  status: string;
  count: string;
  pois: GaodePOI[];
}

async function searchPage(
  city: string,
  page: number,
  offset: number = 25
): Promise<GaodeResponse> {
  const cityCode = CITY_CODES[city] || city;

  const params = new URLSearchParams({
    key: GAODE_KEY,
    keywords: "公共厕所",
    types: "200300|200301|200302|200303|200304", // 公共厕所及相关
    city: cityCode,
    citylimit: "true",
    offset: String(offset),
    page: String(page),
    extensions: "all",
  });

  const url = `${GAODE_PLACE_URL}?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Gaode API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

function normalizePoi(poi: GaodePOI, city: string): RawToiletRecord | null {
  if (!poi.location) return null;

  const [lngStr, latStr] = poi.location.split(",");
  const gcjLng = parseFloat(lngStr);
  const gcjLat = parseFloat(latStr);

  if (isNaN(gcjLng) || isNaN(gcjLat)) return null;

  // Convert GCJ-02 to WGS-84
  const wgs = gcj02ToWgs84({ lng: gcjLng, lat: gcjLat });

  const rawCost = poi.biz_ext?.cost;
  const cost = typeof rawCost === "string" ? rawCost : null;
  let feeCents = 0;
  let feeDescription: string | null = null;
  if (cost && cost !== "免费" && cost !== "0") {
    feeCents = 50; // default assumption
    feeDescription = cost;
  }

  return {
    name: poi.name.substring(0, 300),
    lat: wgs.lat,
    lng: wgs.lng,
    address: poi.address || null,
    city,
    district: poi.adname || null,
    hasSquat: true, // Most Chinese public toilets have squat toilets
    hasSeated: false,
    hasToiletPaper: false, // Rarely provided for free
    hasHandWash: true, // Most have basic washing
    hasHandicap: false,
    hasChangingTable: false,
    hasMirror: false,
    feeCents,
    feeDescription,
    openingHours: poi.deep_info?.opentime || null,
    openingHoursType: poi.deep_info?.opentime ? "scheduled" : "unknown",
    dataSource: "gaode",
    sourceId: `gaode-${poi.id}`,
    rawTags: {},
  };
}

export async function scrapeGaode(city: string): Promise<RawToiletRecord[]> {
  if (!GAODE_KEY) {
    throw new Error("GAODE_WEB_API_KEY not set in environment");
  }

  console.log(`🔍 Searching Gaode POI for ${city}...`);

  const allRecords: RawToiletRecord[] = [];
  let page = 1;
  let totalFetched = 0;

  while (true) {
    const data = await searchPage(city, page, 25);

    if (data.status !== "1") {
      console.log(`   Gaode API returned status ${data.status} on page ${page}`);
      break;
    }

    for (const poi of data.pois) {
      const record = normalizePoi(poi, city);
      if (record) allRecords.push(record);
    }

    totalFetched += data.pois.length;
    console.log(`   Page ${page}: ${data.pois.length} POIs (total: ${allRecords.length})`);

    // Stop if fewer results than page size (last page)
    if (data.pois.length < 25) break;

    // Gaode API limit: max 45 pages for searching
    if (page >= 45) break;

    page++;

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`   Normalized ${allRecords.length} toilet records`);
  return allRecords;
}

// CLI entry — only runs when executed directly
if (process.argv[1]?.includes("gaode")) {
  (async () => {
    const args = process.argv.slice(2);
    const cityArg = args.find((a) => a.startsWith("--city="));
    const city = cityArg?.split("=")[1] || "北京";

    console.log(`📍 Scraping Gaode toilets for: ${city}`);
    const records = await scrapeGaode(city);

    const outputDir = path.join(process.cwd(), "data", "raw");
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `gaode-${city}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
    console.log(`💾 Saved ${records.length} records to ${outputPath}`);
  })().catch(console.error);
}
