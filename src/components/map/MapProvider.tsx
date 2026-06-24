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
  loadingStage: string;
  error: string | null;
  userLocation: { lng: number; lat: number } | null;
  initMap: (container: HTMLDivElement, options?: AMap.MapOptions) => void;
  destroyMap: () => void;
  retry: () => void;
  getUserLocation: () => Promise<{ lng: number; lat: number } | null>;
}

const MapContext = createContext<MapContextValue>({
  amapInstance: null,
  mapInstance: null,
  isLoading: true,
  loadingStage: "",
  error: null,
  userLocation: null,
  initMap: () => {},
  destroyMap: () => {},
  retry: () => {},
  getUserLocation: async () => null,
});

export function useMapContext() {
  return useContext(MapContext);
}

export function MapProvider({ children }: { children: ReactNode }) {
  const [amapInstance, setAmapInstance] = useState<typeof AMap | null>(null);
  const [mapInstance, setMapInstance] = useState<AMap.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState("正在加载地图...");
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const mapRef = useRef<AMap.Map | null>(null);

  const getUserLocation = useCallback(async (): Promise<{ lng: number; lat: number } | null> => {
    if (!navigator.geolocation) return null;
    try {
      return await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
        );
      });
    } catch {
      return null;
    }
  }, []);

  // Load AMap SDK + get user location in parallel
  const doLoad = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadingStage("正在获取位置...");
    setError(null);

    // Start both in parallel
    const amapPromise = loadAMap();
    const locationPromise = getUserLocation();

    Promise.all([amapPromise, locationPromise])
      .then(([amap, loc]) => {
        if (cancelled) return;
        setAmapInstance(amap);
        if (loc) {
          setUserLocation(loc);
          // Don't center map yet — ToiletMap will use this as initial center
        }
        setLoadingStage("");
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "高德地图加载失败");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [getUserLocation]);

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
      const map = new amapInstance.Map(container, defaultOptions);
      mapRef.current = map;
      setMapInstance(map);
    },
    [amapInstance]
  );

  const destroyMap = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.destroy();
      mapRef.current = null;
    }
    setMapInstance(null);
  }, []);

  return (
    <MapContext.Provider
      value={{
        amapInstance,
        mapInstance,
        isLoading,
        loadingStage,
        error,
        userLocation,
        initMap,
        destroyMap,
        retry,
        getUserLocation,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}
