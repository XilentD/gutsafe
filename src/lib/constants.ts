// ─── App Constants ────────────────────────────────────

export const APP_NAME = "拉了么";
export const APP_NAME_EN = "Laleme";
export const APP_DESCRIPTION = "找厕所神器 — 规划每一条带厕所的路线";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─── Map Defaults ────────────────────────────────────

/** Default center: Beijing Tiananmen */
export const DEFAULT_CENTER: [number, number] = [116.397428, 39.90923];
export const DEFAULT_ZOOM = 14;
export const DEFAULT_SEARCH_RADIUS_METERS = 1000;
export const MAX_SEARCH_RADIUS_METERS = 5000;

// ─── Route Planning ──────────────────────────────────

export const DEFAULT_MAX_TOILET_DISTANCE = 500; // meters
export const ROUTE_SAMPLE_INTERVAL = 20; // meters between samples
export const MAX_DETOUR_METERS = 500; // max detour for a toilet stop
export const MAX_ROUTE_PLAN_ITERATIONS = 3;

// ─── Bristol Scale Descriptions ──────────────────────

export const BRISTOL_SCALE = [
  {
    score: 1,
    label: "分离硬块",
    enLabel: "Separate hard lumps",
    description: "像坚果一样的分离硬块，难以排出",
    icon: "🪨",
  },
  {
    score: 2,
    label: "香肠状但有块状",
    enLabel: "Sausage-shaped but lumpy",
    description: "香肠形状，但表面有块状凸起",
    icon: "🥜",
  },
  {
    score: 3,
    label: "香肠状有裂缝",
    enLabel: "Sausage-shaped with cracks",
    description: "像香肠但表面有裂缝",
    icon: "🌭",
  },
  {
    score: 4,
    label: "光滑柔软",
    enLabel: "Smooth and soft",
    description: "像香肠或蛇，光滑柔软 — 理想状态",
    icon: "✅",
  },
  {
    score: 5,
    label: "柔软团块",
    enLabel: "Soft blobs",
    description: "边缘清晰的柔软团块，容易排出",
    icon: "💧",
  },
  {
    score: 6,
    label: "糊状",
    enLabel: "Mushy consistency",
    description: "糊状或泥状，边缘不清晰",
    icon: "🥣",
  },
  {
    score: 7,
    label: "水样便",
    enLabel: "Watery, no solid pieces",
    description: "完全液态，没有固体块 — 腹泻",
    icon: "🌊",
  },
] as const;

// ─── Symptom Types ───────────────────────────────────

export const SYMPTOM_TYPES = [
  { value: "bloating", label: "腹胀", icon: "🎈" },
  { value: "cramping", label: "腹痛/痉挛", icon: "🔪" },
  { value: "diarrhea", label: "腹泻", icon: "💧" },
  { value: "constipation", label: "便秘", icon: "🧱" },
  { value: "nausea", label: "恶心", icon: "🤢" },
  { value: "gas", label: "胀气", icon: "💨" },
  { value: "heartburn", label: "烧心/反酸", icon: "🔥" },
  { value: "urgency", label: "突然急迫", icon: "🏃" },
  { value: "incomplete", label: "排便不尽", icon: "🔄" },
  { value: "mucus", label: "粘液便", icon: "🫧" },
] as const;

// ─── Food Categories ─────────────────────────────────

export const FOOD_CATEGORIES = [
  { value: "spicy", label: "辛辣", icon: "🌶️", riskFactor: 0.9 },
  { value: "dairy", label: "乳制品", icon: "🥛", riskFactor: 0.8 },
  { value: "greasy", label: "油腻", icon: "🍟", riskFactor: 0.75 },
  { value: "caffeine", label: "咖啡因", icon: "☕", riskFactor: 0.7 },
  { value: "alcohol", label: "酒精", icon: "🍺", riskFactor: 0.85 },
  { value: "fiber", label: "高纤维", icon: "🥬", riskFactor: -0.3 },
  { value: "gas_forming", label: "产气食物", icon: "🫘", riskFactor: 0.65 },
  { value: "raw", label: "生冷", icon: "🧊", riskFactor: 0.6 },
  { value: "sweet", label: "甜食", icon: "🍰", riskFactor: 0.4 },
  { value: "fermented", label: "发酵食品", icon: "🫙", riskFactor: -0.2 },
  { value: "gluten", label: "麸质", icon: "🍞", riskFactor: 0.55 },
  { value: "fodmap", label: "高FODMAP", icon: "🧅", riskFactor: 0.8 },
] as const;

// ─── Meal Types ──────────────────────────────────────

export const MEAL_TIMES = [
  { value: "breakfast", label: "早餐" },
  { value: "lunch", label: "午餐" },
  { value: "dinner", label: "晚餐" },
  { value: "snack", label: "零食/加餐" },
] as const;

export const PORTION_SIZES = [
  { value: "small", label: "少量" },
  { value: "medium", label: "中量" },
  { value: "large", label: "大量" },
] as const;

// ─── Toilet Amenities ────────────────────────────────

export const AMENITY_CONFIG = [
  { key: "hasSquat", label: "蹲便器", icon: "🚽" },
  { key: "hasSeated", label: "坐便器", icon: "🪑" },
  { key: "hasToiletPaper", label: "卫生纸", icon: "🧻" },
  { key: "hasHandWash", label: "洗手台", icon: "🚰" },
  { key: "hasHandicap", label: "无障碍", icon: "♿" },
  { key: "hasChangingTable", label: "母婴台", icon: "👶" },
  { key: "hasMirror", label: "镜子", icon: "🪞" },
] as const;

// ─── Data Sources ────────────────────────────────────

export const DATA_SOURCES = ["osm", "gaode", "government", "user"] as const;
