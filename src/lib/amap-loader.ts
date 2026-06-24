/**
 * Gaode (高德) Map JS API loader wrapper.
 * Lazy-loads the AMap SDK and tracks loading state.
 */
import { load as loadAMapAPI } from "@amap/amap-jsapi-loader";

const GAODE_KEY =
  process.env.NEXT_PUBLIC_GAODE_JS_API_KEY ||
  process.env.GAODE_JS_API_KEY ||
  "";

const LOAD_TIMEOUT = 15000; // 15 seconds max

// Minimal plugins - only what's actively used
const REQUIRED_PLUGINS = ["AMap.Geolocation"];

let loadPromise: Promise<typeof AMap> | null = null;
let loadResolve: ((value: typeof AMap) => void) | null = null;
let loadReject: ((reason: Error) => void) | null = null;

export async function loadAMap(
  options: { key?: string; version?: string; plugins?: string[] } = {}
): Promise<typeof AMap> {
  if (loadPromise) return loadPromise;

  const key = options.key || GAODE_KEY;

  if (!key) {
    return Promise.reject(
      new Error("高德地图 API Key 未配置。请在 .env.local 中设置 GAODE_JS_API_KEY")
    );
  }

  // Create a promise with timeout
  loadPromise = new Promise<typeof AMap>((resolve, reject) => {
    loadResolve = resolve;
    loadReject = reject;

    const timeout = setTimeout(() => {
      reject(new Error("高德地图加载超时，请检查网络或刷新重试"));
    }, LOAD_TIMEOUT);

    loadAMapAPI({
      key,
      version: options.version || "2.0",
      plugins: options.plugins || REQUIRED_PLUGINS,
    })
      .then((amap) => {
        clearTimeout(timeout);
        resolve(amap as typeof AMap);
      })
      .catch((err) => {
        clearTimeout(timeout);
        reject(new Error(err?.message || "高德地图 SDK 加载失败"));
      });
  });

  return loadPromise;
}

export function getGaodeKey(): string {
  return GAODE_KEY;
}

export function resetLoader(): void {
  loadPromise = null;
  loadResolve = null;
  loadReject = null;
}
