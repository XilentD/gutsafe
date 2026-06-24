/**
 * Gaode (高德) Map JS API loader wrapper.
 * Uses dynamic import() to avoid SSR crash — the package checks window at module top level.
 */
const GAODE_KEY =
  process.env.NEXT_PUBLIC_GAODE_JS_API_KEY ||
  process.env.GAODE_JS_API_KEY ||
  "";

const LOAD_TIMEOUT = 15000;
const REQUIRED_PLUGINS = ["AMap.Geolocation"];

let loadPromise: Promise<typeof AMap> | null = null;

export async function loadAMap(
  options: { key?: string; version?: string; plugins?: string[] } = {}
): Promise<typeof AMap> {
  if (loadPromise) return loadPromise;

  const key = options.key || GAODE_KEY;
  if (!key) {
    return Promise.reject(new Error("高德地图 API Key 未配置。请在 .env.local 中设置 GAODE_JS_API_KEY"));
  }

  // Dynamic import to avoid SSR crash
  loadPromise = new Promise<typeof AMap>(async (resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("高德地图加载超时，请检查网络或刷新重试")), LOAD_TIMEOUT);

    try {
      const mod = await import("@amap/amap-jsapi-loader");
      // Handle both CJS and ESM interop
      const loadAPI =
        typeof mod.load === "function"
          ? mod.load
          : typeof (mod as unknown as { default: { load?: Function } }).default?.load === "function"
            ? (mod as unknown as { default: { load: Function } }).default.load
            : null;

      if (typeof loadAPI !== "function") {
        clearTimeout(timeout);
        reject(new Error("高德地图加载器初始化失败"));
        return;
      }

      const amap = await loadAPI({
        key,
        version: options.version || "2.0",
        plugins: options.plugins || REQUIRED_PLUGINS,
      });
      clearTimeout(timeout);
      resolve(amap as typeof AMap);
    } catch (err) {
      clearTimeout(timeout);
      reject(new Error((err as Error)?.message || "高德地图 SDK 加载失败"));
    }
  });

  return loadPromise;
}

export function getGaodeKey(): string {
  return GAODE_KEY;
}

export function resetLoader(): void {
  loadPromise = null;
}
