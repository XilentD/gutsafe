/**
 * Gaode (高德) Map JS API loader wrapper.
 * Dynamic import keeps this SSR-safe.
 */
const GAODE_KEY =
  process.env.NEXT_PUBLIC_GAODE_JS_API_KEY ||
  process.env.GAODE_JS_API_KEY ||
  "";

const LOAD_TIMEOUT = 15000;
const REQUIRED_PLUGINS = ["AMap.Geolocation", "AMap.Walking", "AMap.Riding", "AMap.Driving"];

let loadPromise: Promise<typeof AMap> | null = null;

export async function loadAMap(
  options: { key?: string; version?: string; plugins?: string[] } = {}
): Promise<typeof AMap> {
  // Reuse cached promise — only load SDK once
  if (loadPromise) return loadPromise;

  const key = options.key || GAODE_KEY;
  if (!key) {
    return Promise.reject(
      new Error("高德地图 API Key 未配置。请在 .env.local 中设置 NEXT_PUBLIC_GAODE_JS_API_KEY")
    );
  }

  loadPromise = new Promise<typeof AMap>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("高德地图加载超时，请检查网络或刷新重试")),
      LOAD_TIMEOUT
    );
    // Dynamic import avoids SSR crash (package checks `window` at top level)
    import("@amap/amap-jsapi-loader")
      .then((mod) => {
        clearTimeout(timeout);
        // CJS interop: try named export first, then default
        const loadAPI: Function | undefined =
          mod?.load || (mod as any)?.default?.load;
        if (typeof loadAPI !== "function") {
          reject(new Error("高德地图 SDK 格式异常"));
          return;
        }
        return loadAPI({
          key,
          version: options.version || "2.0",
          plugins: options.plugins || REQUIRED_PLUGINS,
        });
      })
      .then((amap) => {
        clearTimeout(timeout);
        if (amap) resolve(amap as typeof AMap);
      })
      .catch((err) => {
        clearTimeout(timeout);
        reject(
          new Error(
            (err as Error)?.message || "高德地图 SDK 加载失败"
          )
        );
      });
  });

  return loadPromise;
}

export function getGaodeKey(): string {
  return GAODE_KEY;
}

export function resetLoader(): void {
  loadPromise = null;
}
