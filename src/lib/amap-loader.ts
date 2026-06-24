/**
 * Gaode (高德) Map JS API loader wrapper.
 * Lazy-loads the AMap SDK and tracks loading state.
 */
import AMapLoader from "@amap/amap-jsapi-loader";

const GAODE_KEY = process.env.NEXT_PUBLIC_GAODE_JS_API_KEY || process.env.GAODE_JS_API_KEY || "";

let loadPromise: Promise<typeof AMap> | null = null;

const DEFAULT_PLUGINS = [
  "AMap.Geolocation",
  "AMap.Geocoder",
  "AMap.PlaceSearch",
  "AMap.Walking",
  "AMap.MarkerClusterer",
  "AMap.Scale",
  "AMap.ToolBar",
];

export async function loadAMap(
  options: { key?: string; version?: string; plugins?: string[] } = {}
): Promise<typeof AMap> {
  if (loadPromise) return loadPromise;

  const key = options.key || GAODE_KEY;

  if (!key) {
    throw new Error(
      "Gaode JS API key not configured. Set GAODE_JS_API_KEY in .env.local"
    );
  }

  loadPromise = AMapLoader({
    key,
    version: options.version || "2.0",
    plugins: options.plugins || DEFAULT_PLUGINS,
  }) as Promise<typeof AMap>;

  return loadPromise;
}

export function getGaodeKey(): string {
  return GAODE_KEY;
}
