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
  // 江苏
  "无锡": { south: 31.40, west: 120.10, north: 31.70, east: 120.45 },
  "常州": { south: 31.60, west: 119.85, north: 31.95, east: 120.20 },
  "徐州": { south: 34.10, west: 117.00, north: 34.40, east: 117.50 },
  "南通": { south: 31.85, west: 120.70, north: 32.15, east: 121.10 },
  "扬州": { south: 32.25, west: 119.25, north: 32.55, east: 119.60 },
  // 浙江
  "温州": { south: 27.85, west: 120.45, north: 28.15, east: 120.85 },
  "嘉兴": { south: 30.60, west: 120.60, north: 30.90, east: 120.95 },
  "绍兴": { south: 29.85, west: 120.35, north: 30.15, east: 120.75 },
  "金华": { south: 28.95, west: 119.50, north: 29.25, east: 119.85 },
  "台州": { south: 28.55, west: 121.25, north: 28.80, east: 121.60 },
  // 河北
  "唐山": { south: 39.50, west: 118.00, north: 39.80, east: 118.35 },
  "保定": { south: 38.70, west: 115.30, north: 39.00, east: 115.70 },
  "邯郸": { south: 36.45, west: 114.30, north: 36.75, east: 114.65 },
  // 山西
  "大同": { south: 39.95, west: 113.15, north: 40.20, east: 113.45 },
  "临汾": { south: 35.95, west: 111.35, north: 36.20, east: 111.65 },
  // 内蒙古
  "包头": { south: 40.45, west: 109.70, north: 40.75, east: 110.15 },
  "鄂尔多斯": { south: 39.65, west: 109.65, north: 39.95, east: 110.15 },
  // 辽宁
  "鞍山": { south: 40.95, west: 122.85, north: 41.25, east: 123.20 },
  "抚顺": { south: 41.70, west: 123.70, north: 41.95, east: 124.10 },
  // 吉林
  "吉林": { south: 43.65, west: 126.30, north: 43.95, east: 126.75 },
  // 黑龙江
  "大庆": { south: 46.40, west: 124.80, north: 46.75, east: 125.25 },
  "齐齐哈尔": { south: 47.15, west: 123.70, north: 47.50, east: 124.20 },
  // 安徽
  "芜湖": { south: 31.15, west: 118.20, north: 31.50, east: 118.55 },
  "马鞍山": { south: 31.55, west: 118.35, north: 31.75, east: 118.65 },
  // 福建
  "泉州": { south: 24.75, west: 118.45, north: 25.05, east: 118.80 },
  "漳州": { south: 24.40, west: 117.55, north: 24.65, east: 117.85 },
  // 江西
  "九江": { south: 29.55, west: 115.85, north: 29.85, east: 116.15 },
  "赣州": { south: 25.75, west: 114.80, north: 25.95, east: 115.10 },
  // 山东
  "烟台": { south: 37.35, west: 121.20, north: 37.65, east: 121.55 },
  "威海": { south: 37.35, west: 121.95, north: 37.60, east: 122.30 },
  "潍坊": { south: 36.55, west: 119.00, north: 36.85, east: 119.35 },
  "临沂": { south: 34.90, west: 118.15, north: 35.20, east: 118.55 },
  "淄博": { south: 36.65, west: 117.90, north: 36.95, east: 118.25 },
  // 河南
  "洛阳": { south: 34.50, west: 112.25, north: 34.80, east: 112.65 },
  "开封": { south: 34.65, west: 114.15, north: 34.90, east: 114.50 },
  "南阳": { south: 32.85, west: 112.35, north: 33.15, east: 112.75 },
  "许昌": { south: 33.90, west: 113.65, north: 34.15, east: 113.95 },
  // 湖北
  "宜昌": { south: 30.55, west: 111.15, north: 30.85, east: 111.45 },
  "襄阳": { south: 31.85, west: 111.95, north: 32.15, east: 112.35 },
  // 湖南
  "株洲": { south: 27.70, west: 113.00, north: 28.00, east: 113.30 },
  "湘潭": { south: 27.70, west: 112.80, north: 27.95, east: 113.10 },
  "衡阳": { south: 26.75, west: 112.45, north: 27.00, east: 112.75 },
  "岳阳": { south: 29.25, west: 113.00, north: 29.50, east: 113.35 },
  // 广西
  "柳州": { south: 24.20, west: 109.25, north: 24.50, east: 109.65 },
  "北海": { south: 21.35, west: 109.00, north: 21.60, east: 109.35 },
  // 四川
  "绵阳": { south: 31.35, west: 104.55, north: 31.65, east: 104.95 },
  "德阳": { south: 31.00, west: 104.25, north: 31.25, east: 104.55 },
  "宜宾": { south: 28.65, west: 104.45, north: 28.90, east: 104.80 },
  // 贵州
  "遵义": { south: 27.55, west: 106.75, north: 27.85, east: 107.10 },
  // 陕西
  "咸阳": { south: 34.20, west: 108.55, north: 34.50, east: 108.95 },
  "宝鸡": { south: 34.20, west: 107.05, north: 34.50, east: 107.35 },
  // 甘肃
  "天水": { south: 34.45, west: 105.60, north: 34.70, east: 105.95 },
  // 宁夏
  "吴忠": { south: 37.85, west: 106.05, north: 38.10, east: 106.35 },
  // 新疆
  "克拉玛依": { south: 45.45, west: 84.70, north: 45.75, east: 85.05 },
  // === Auto-generated from prefecture-level city centers ===


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
  "沧州": { south: 38.10, west: 116.60, north: 38.50, east: 117.00 },
  "廊坊": { south: 39.32, west: 116.48, north: 39.72, east: 116.88 },
  "邢台": { south: 36.87, west: 114.30, north: 37.27, east: 114.70 },
  "承德": { south: 40.78, west: 117.73, north: 41.18, east: 118.13 },
  "张家口": { south: 40.62, west: 114.68, north: 41.02, east: 115.08 },
  "秦皇岛": { south: 39.73, west: 119.40, north: 40.13, east: 119.80 },
  "衡水": { south: 37.53, west: 115.47, north: 37.93, east: 115.87 },
  "长治": { south: 36.00, west: 112.92, north: 36.40, east: 113.32 },
  "晋城": { south: 35.30, west: 112.65, north: 35.70, east: 113.05 },
  "朔州": { south: 39.13, west: 112.23, north: 39.53, east: 112.63 },
  "晋中": { south: 37.49, west: 112.90, north: 37.89, east: 113.30 },
  "运城": { south: 34.83, west: 110.80, north: 35.23, east: 111.20 },
  "忻州": { south: 38.22, west: 112.53, north: 38.62, east: 112.93 },
  "吕梁": { south: 37.32, west: 110.94, north: 37.72, east: 111.34 },
  "呼伦贝尔": { south: 49.00, west: 119.57, north: 49.40, east: 119.97 },
  "赤峰": { south: 42.07, west: 118.67, north: 42.47, east: 119.07 },
  "通辽": { south: 43.42, west: 122.07, north: 43.82, east: 122.47 },
  "乌海": { south: 39.46, west: 106.62, north: 39.86, east: 107.02 },
  "巴彦淖尔": { south: 40.56, west: 107.22, north: 40.96, east: 107.62 },
  "乌兰察布": { south: 40.79, west: 112.93, north: 41.19, east: 113.33 },
  "营口": { south: 40.47, west: 122.03, north: 40.87, east: 122.43 },
  "锦州": { south: 40.90, west: 120.93, north: 41.30, east: 121.33 },
  "丹东": { south: 39.93, west: 124.18, north: 40.33, east: 124.58 },
  "辽阳": { south: 41.07, west: 122.97, north: 41.47, east: 123.37 },
  "盘锦": { south: 40.92, west: 121.87, north: 41.32, east: 122.27 },
  "铁岭": { south: 42.08, west: 123.65, north: 42.48, east: 124.05 },
  "朝阳": { south: 41.37, west: 120.25, north: 41.77, east: 120.65 },
  "葫芦岛": { south: 40.55, west: 120.63, north: 40.95, east: 121.03 },
  "本溪": { south: 41.10, west: 123.57, north: 41.50, east: 123.97 },
  "阜新": { south: 41.82, west: 121.47, north: 42.22, east: 121.87 },
  "四平": { south: 42.97, west: 124.17, north: 43.37, east: 124.57 },
  "辽源": { south: 42.68, west: 124.95, north: 43.08, east: 125.35 },
  "通化": { south: 41.53, west: 125.73, north: 41.93, east: 126.13 },
  "白山": { south: 41.73, west: 126.22, north: 42.13, east: 126.62 },
  "松原": { south: 44.93, west: 124.62, north: 45.33, east: 125.02 },
  "白城": { south: 45.42, west: 122.63, north: 45.82, east: 123.03 },
  "鸡西": { south: 45.10, west: 130.77, north: 45.50, east: 131.17 },
  "鹤岗": { south: 47.13, west: 130.10, north: 47.53, east: 130.50 },
  "双鸭山": { south: 46.45, west: 130.97, north: 46.85, east: 131.37 },
  "伊春": { south: 47.53, west: 128.70, north: 47.93, east: 129.10 },
  "佳木斯": { south: 46.60, west: 130.15, north: 47.00, east: 130.55 },
  "七台河": { south: 45.57, west: 130.80, north: 45.97, east: 131.20 },
  "牡丹江": { south: 44.38, west: 129.42, north: 44.78, east: 129.82 },
  "黑河": { south: 50.05, west: 127.28, north: 50.45, east: 127.68 },
  "绥化": { south: 46.43, west: 126.78, north: 46.83, east: 127.18 },
  "连云港": { south: 34.40, west: 119.02, north: 34.80, east: 119.42 },
  "淮安": { south: 33.30, west: 118.83, north: 33.70, east: 119.23 },
  "盐城": { south: 33.18, west: 119.93, north: 33.58, east: 120.33 },
  "镇江": { south: 32.00, west: 119.23, north: 32.40, east: 119.63 },
  "泰州": { south: 32.26, west: 119.72, north: 32.66, east: 120.12 },
  "宿迁": { south: 33.73, west: 118.08, north: 34.13, east: 118.48 },
  "湖州": { south: 30.67, west: 119.90, north: 31.07, east: 120.30 },
  "衢州": { south: 28.75, west: 118.67, north: 29.15, east: 119.07 },
  "舟山": { south: 29.82, west: 121.90, north: 30.22, east: 122.30 },
  "丽水": { south: 28.25, west: 119.72, north: 28.65, east: 120.12 },
  "滁州": { south: 32.10, west: 118.10, north: 32.50, east: 118.50 },
  "阜阳": { south: 32.70, west: 115.62, north: 33.10, east: 116.02 },
  "宿州": { south: 33.43, west: 116.77, north: 33.83, east: 117.17 },
  "六安": { south: 31.53, west: 116.30, north: 31.93, east: 116.70 },
  "亳州": { south: 33.65, west: 115.58, north: 34.05, east: 115.98 },
  "池州": { south: 30.45, west: 117.28, north: 30.85, east: 117.68 },
  "宣城": { south: 30.73, west: 118.55, north: 31.13, east: 118.95 },
  "淮北": { south: 33.77, west: 116.60, north: 34.17, east: 117.00 },
  "铜陵": { south: 30.73, west: 117.62, north: 31.13, east: 118.02 },
  "黄山": { south: 29.52, west: 118.13, north: 29.92, east: 118.53 },
  "龙岩": { south: 24.88, west: 116.82, north: 25.28, east: 117.22 },
  "三明": { south: 26.07, west: 117.43, north: 26.47, east: 117.83 },
  "南平": { south: 26.43, west: 117.97, north: 26.83, east: 118.37 },
  "宁德": { south: 26.47, west: 119.35, north: 26.87, east: 119.75 },
  "莆田": { south: 25.25, west: 118.80, north: 25.65, east: 119.20 },
  "景德镇": { south: 29.10, west: 116.98, north: 29.50, east: 117.38 },
  "萍乡": { south: 27.42, west: 113.65, north: 27.82, east: 114.05 },
  "新余": { south: 27.60, west: 114.72, north: 28.00, east: 115.12 },
  "鹰潭": { south: 28.07, west: 116.83, north: 28.47, east: 117.23 },
  "宜春": { south: 27.62, west: 114.18, north: 28.02, east: 114.58 },
  "上饶": { south: 28.25, west: 117.77, north: 28.65, east: 118.17 },
  "吉安": { south: 26.92, west: 114.77, north: 27.32, east: 115.17 },
  "抚州": { south: 27.78, west: 116.15, north: 28.18, east: 116.55 },
  "东营": { south: 37.23, west: 118.47, north: 37.63, east: 118.87 },
  "日照": { south: 35.22, west: 119.33, north: 35.62, east: 119.73 },
  "德州": { south: 37.23, west: 116.10, north: 37.63, east: 116.50 },
  "聊城": { south: 36.25, west: 115.80, north: 36.65, east: 116.20 },
  "滨州": { south: 37.18, west: 117.80, north: 37.58, east: 118.20 },
  "菏泽": { south: 35.03, west: 115.23, north: 35.43, east: 115.63 },
  "枣庄": { south: 34.67, west: 117.35, north: 35.07, east: 117.75 },
  "泰安": { south: 35.98, west: 116.93, north: 36.38, east: 117.33 },
  "济宁": { south: 35.20, west: 116.38, north: 35.60, east: 116.78 },
  "漯河": { south: 33.38, west: 113.82, north: 33.78, east: 114.22 },
  "濮阳": { south: 35.57, west: 114.83, north: 35.97, east: 115.23 },
  "新乡": { south: 35.10, west: 113.67, north: 35.50, east: 114.07 },
  "安阳": { south: 35.90, west: 114.15, north: 36.30, east: 114.55 },
  "商丘": { south: 34.22, west: 115.45, north: 34.62, east: 115.85 },
  "信阳": { south: 31.93, west: 113.87, north: 32.33, east: 114.27 },
  "周口": { south: 33.43, west: 114.43, north: 33.83, east: 114.83 },
  "驻马店": { south: 32.80, west: 113.82, north: 33.20, east: 114.22 },
  "三门峡": { south: 34.57, west: 111.00, north: 34.97, east: 111.40 },
  "平顶山": { south: 33.53, west: 113.10, north: 33.93, east: 113.50 },
  "焦作": { south: 35.03, west: 113.03, north: 35.43, east: 113.43 },
  "鹤壁": { south: 35.55, west: 114.08, north: 35.95, east: 114.48 },
  "荆州": { south: 30.13, west: 112.03, north: 30.53, east: 112.43 },
  "黄石": { south: 30.00, west: 114.88, north: 30.40, east: 115.28 },
  "十堰": { south: 32.45, west: 110.60, north: 32.85, east: 111.00 },
  "鄂州": { south: 30.20, west: 114.68, north: 30.60, east: 115.08 },
  "荆门": { south: 30.83, west: 112.00, north: 31.23, east: 112.40 },
  "孝感": { south: 30.72, west: 113.75, north: 31.12, east: 114.15 },
  "黄冈": { south: 30.25, west: 114.67, north: 30.65, east: 115.07 },
  "咸宁": { south: 29.63, west: 114.13, north: 30.03, east: 114.53 },
  "随州": { south: 31.52, west: 113.18, north: 31.92, east: 113.58 },
  "邵阳": { south: 27.03, west: 111.27, north: 27.43, east: 111.67 },
  "益阳": { south: 28.38, west: 112.13, north: 28.78, east: 112.53 },
  "郴州": { south: 25.58, west: 112.83, north: 25.98, east: 113.23 },
  "永州": { south: 26.22, west: 111.42, north: 26.62, east: 111.82 },
  "怀化": { south: 27.35, west: 109.77, north: 27.75, east: 110.17 },
  "娄底": { south: 27.53, west: 111.80, north: 27.93, east: 112.20 },
  "常德": { south: 28.83, west: 111.48, north: 29.23, east: 111.88 },
  "张家界": { south: 28.93, west: 110.28, north: 29.33, east: 110.68 },
  "防城港": { south: 21.50, west: 108.15, north: 21.90, east: 108.55 },
  "钦州": { south: 21.75, west: 108.42, north: 22.15, east: 108.82 },
  "贵港": { south: 22.90, west: 109.40, north: 23.30, east: 109.80 },
  "玉林": { south: 22.43, west: 109.97, north: 22.83, east: 110.37 },
  "百色": { south: 23.70, west: 106.42, north: 24.10, east: 106.82 },
  "贺州": { south: 24.20, west: 111.35, north: 24.60, east: 111.75 },
  "河池": { south: 24.50, west: 107.85, north: 24.90, east: 108.25 },
  "来宾": { south: 23.53, west: 109.03, north: 23.93, east: 109.43 },
  "崇左": { south: 22.18, west: 107.17, north: 22.58, east: 107.57 },
  "梧州": { south: 23.28, west: 111.08, north: 23.68, east: 111.48 },
  "自贡": { south: 29.15, west: 104.58, north: 29.55, east: 104.98 },
  "泸州": { south: 28.67, west: 105.23, north: 29.07, east: 105.63 },
  "广元": { south: 32.23, west: 105.63, north: 32.63, east: 106.03 },
  "遂宁": { south: 30.30, west: 105.38, north: 30.70, east: 105.78 },
  "内江": { south: 29.38, west: 104.85, north: 29.78, east: 105.25 },
  "乐山": { south: 29.40, west: 103.57, north: 29.80, east: 103.97 },
  "南充": { south: 30.60, west: 105.88, north: 31.00, east: 106.28 },
  "眉山": { south: 29.85, west: 103.63, north: 30.25, east: 104.03 },
  "广安": { south: 30.27, west: 106.43, north: 30.67, east: 106.83 },
  "达州": { south: 31.02, west: 107.30, north: 31.42, east: 107.70 },
  "雅安": { south: 29.78, west: 102.80, north: 30.18, east: 103.20 },
  "巴中": { south: 31.65, west: 106.57, north: 32.05, east: 106.97 },
  "资阳": { south: 29.92, west: 104.43, north: 30.32, east: 104.83 },
  "攀枝花": { south: 26.38, west: 101.52, north: 26.78, east: 101.92 },
  "六盘水": { south: 26.38, west: 104.63, north: 26.78, east: 105.03 },
  "安顺": { south: 26.05, west: 105.73, north: 26.45, east: 106.13 },
  "毕节": { south: 27.10, west: 105.10, north: 27.50, east: 105.50 },
  "铜仁": { south: 27.52, west: 108.98, north: 27.92, east: 109.38 },
  "玉溪": { south: 24.15, west: 102.35, north: 24.55, east: 102.75 },
  "曲靖": { south: 25.30, west: 103.60, north: 25.70, east: 104.00 },
  "保山": { south: 24.92, west: 98.97, north: 25.32, east: 99.37 },
  "昭通": { south: 27.13, west: 103.52, north: 27.53, east: 103.92 },
  "丽江": { south: 26.67, west: 100.03, north: 27.07, east: 100.43 },
  "普洱": { south: 22.58, west: 100.77, north: 22.98, east: 101.17 },
  "临沧": { south: 23.68, west: 99.88, north: 24.08, east: 100.28 },
  "日喀则": { south: 29.07, west: 88.68, north: 29.47, east: 89.08 },
  "昌都": { south: 30.93, west: 96.98, north: 31.33, east: 97.38 },
  "林芝": { south: 29.45, west: 94.17, north: 29.85, east: 94.57 },
  "铜川": { south: 34.88, west: 108.88, north: 35.28, east: 109.28 },
  "渭南": { south: 34.30, west: 109.30, north: 34.70, east: 109.70 },
  "延安": { south: 36.38, west: 109.28, north: 36.78, east: 109.68 },
  "汉中": { south: 32.87, west: 106.82, north: 33.27, east: 107.22 },
  "榆林": { south: 38.08, west: 109.53, north: 38.48, east: 109.93 },
  "安康": { south: 32.48, west: 108.82, north: 32.88, east: 109.22 },
  "商洛": { south: 33.67, west: 109.73, north: 34.07, east: 110.13 },
  "白银": { south: 36.35, west: 103.98, north: 36.75, east: 104.38 },
  "武威": { south: 37.73, west: 102.43, north: 38.13, east: 102.83 },
  "张掖": { south: 38.73, west: 100.25, north: 39.13, east: 100.65 },
  "平凉": { south: 35.35, west: 106.47, north: 35.75, east: 106.87 },
  "酒泉": { south: 39.53, west: 98.32, north: 39.93, east: 98.72 },
  "庆阳": { south: 35.53, west: 107.43, north: 35.93, east: 107.83 },
  "定西": { south: 35.38, west: 104.42, north: 35.78, east: 104.82 },
  "陇南": { south: 33.20, west: 104.72, north: 33.60, east: 105.12 },
  "海东": { south: 36.30, west: 101.90, north: 36.70, east: 102.30 },
  "固原": { south: 35.80, west: 106.08, north: 36.20, east: 106.48 },
  "中卫": { south: 37.30, west: 104.98, north: 37.70, east: 105.38 },
  "石嘴山": { south: 38.78, west: 106.18, north: 39.18, east: 106.58 },
  "吐鲁番": { south: 42.75, west: 88.98, north: 43.15, east: 89.38 },
  "哈密": { south: 42.63, west: 93.32, north: 43.03, east: 93.72 },
  "昌吉": { south: 43.82, west: 87.10, north: 44.22, east: 87.50 },
  "阿克苏": { south: 40.97, west: 80.07, north: 41.37, east: 80.47 },
  "喀什": { south: 39.27, west: 75.78, north: 39.67, east: 76.18 },
  "和田": { south: 36.92, west: 79.73, north: 37.32, east: 80.13 },
  "伊犁": { south: 43.72, west: 81.12, north: 44.12, east: 81.52 },};
