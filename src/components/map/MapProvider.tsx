"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { loadAMap, resetLoader } from "@/lib/amap-loader";

interface MapContextValue {
  amapInstance: typeof AMap | null;
  mapInstance: AMap.Map | null;
  isLoading: boolean;
  error: string | null;
  initMap: (container: HTMLDivElement, options?: AMap.MapOptions) => void;
  destroyMap: () => void;
  retry: () => void;
}

const MapContext = createContext<MapContextValue>({
  amapInstance: null,
  mapInstance: null,
  isLoading: true,
  error: null,
  initMap: () => {},
  destroyMap: () => {},
  retry: () => {},
});

export function useMapContext() {
  return useContext(MapContext);
}

export function MapProvider({ children }: { children: ReactNode }) {
  const [amapInstance, setAmapInstance] = useState<typeof AMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const mapRef = useRef<AMap.Map | null>(null);

  // Load AMap SDK
  const doLoad = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    loadAMap()
      .then((amap) => {
        if (!cancelled) {
          setAmapInstance(amap);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "高德地图加载失败");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cancel = doLoad();
    return cancel;
  }, [doLoad, retryCount]);

  const retry = useCallback(() => {
    resetLoader();
    setRetryCount((c) => c + 1);
  }, []);

  const initMap = useCallback(
    (container: HTMLDivElement, options?: AMap.MapOptions) => {
      if (!amapInstance) return;

      if (mapRef.current) {
        mapRef.current.destroy();
      }

      const defaultOptions: AMap.MapOptions = {
        zoom: 14,
        center: [116.397428, 39.90923],
        viewMode: "2D",
        resizeEnable: true,
        ...options,
      };

      mapRef.current = new amapInstance.Map(container, defaultOptions);
    },
    [amapInstance]
  );

  const destroyMap = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.destroy();
      mapRef.current = null;
    }
  }, []);

  return (
    <MapContext.Provider
      value={{
        amapInstance,
        mapInstance: mapRef.current,
        isLoading,
        error,
        initMap,
        destroyMap,
        retry,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}
