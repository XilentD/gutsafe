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
import { loadAMap } from "@/lib/amap-loader";

interface MapContextValue {
  amapInstance: typeof AMap | null;
  mapInstance: AMap.Map | null;
  isLoading: boolean;
  error: string | null;
  initMap: (container: HTMLDivElement, options?: AMap.MapOptions) => void;
  destroyMap: () => void;
}

const MapContext = createContext<MapContextValue>({
  amapInstance: null,
  mapInstance: null,
  isLoading: true,
  error: null,
  initMap: () => {},
  destroyMap: () => {},
});

export function useMapContext() {
  return useContext(MapContext);
}

export function MapProvider({ children }: { children: ReactNode }) {
  const [amapInstance, setAmapInstance] = useState<typeof AMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<AMap.Map | null>(null);

  // Load AMap SDK once
  useEffect(() => {
    let cancelled = false;

    loadAMap()
      .then((amap) => {
        if (!cancelled) {
          setAmapInstance(amap);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load map SDK");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const initMap = useCallback(
    (container: HTMLDivElement, options?: AMap.MapOptions) => {
      if (!amapInstance) return;

      // Destroy existing map
      if (mapRef.current) {
        mapRef.current.destroy();
      }

      const defaultOptions: AMap.MapOptions = {
        zoom: 14,
        center: [116.397428, 39.90923], // Beijing center
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
      }}
    >
      {children}
    </MapContext.Provider>
  );
}
