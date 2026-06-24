/**
 * Minimal AMap (高德地图) type declarations for TypeScript.
 * These cover the subset of AMap JS API v2.0 used in this project.
 */
declare namespace AMap {
  function plugin(plugins: string[], callback: () => void): void;
  class LngLat {
    constructor(lng: number, lat: number);
    getLng(): number;
    getLat(): number;
    lng: number;
    lat: number;
  }

  class Pixel {
    constructor(x: number, y: number);
  }

  class Bounds {
    constructor(minLng: number, minLat: number, maxLng: number, maxLat: number);
    getCenter(): LngLat;
    getNorthEast(): LngLat;
    getSouthWest(): LngLat;
  }

  class Marker {
    constructor(opts: MarkerOptions);
    setMap(map: Map | null): void;
    remove(): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
  }

  interface MarkerOptions {
    position: LngLat;
    content?: HTMLElement | string;
    offset?: Pixel;
    icon?: string | Icon;
    title?: string;
    zIndex?: number;
  }

  class Icon {
    constructor(opts: { image: string; size?: Pixel; imageSize?: Pixel });
  }

  interface MapOptions {
    zoom?: number;
    center?: [number, number];
    viewMode?: "2D" | "3D";
    resizeEnable?: boolean;
    layers?: TileLayer[];
  }

  class TileLayer {
    constructor(opts?: Record<string, unknown>);
  }

  class Map {
    constructor(container: HTMLDivElement | string, opts?: MapOptions);
    setCenter(center: LngLat | [number, number]): void;
    getCenter(): LngLat;
    setZoom(zoom: number): void;
    getZoom(): number;
    getBounds(): Bounds;
    destroy(): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    setFitView(overlays?: Marker[] | null, immediately?: boolean, bounds?: Bounds | [number, number, number, number]): void;
    add(overlay: Marker | Marker[] | Polyline): void;
    remove(overlay: Marker | Marker[] | Polyline): void;
    panTo(position: LngLat): void;
  }

  class Geolocation {
    constructor(opts?: { enableHighAccuracy?: boolean; timeout?: number });
    getCurrentPosition(
      callback: (status: string, result: { position: LngLat }) => void
    ): void;
  }

  class Geocoder {
    constructor(opts?: Record<string, unknown>);
    getLocation(
      address: string,
      callback: (status: string, result: { geocodes: Array<{ location: LngLat }> }) => void
    ): void;
  }

  namespace GeometryUtil {
    function distance(point1: [number, number], point2: [number, number]): number;
  }

  class PlaceSearch {
    constructor(opts?: { type?: string; city?: string; pageSize?: number });
    searchNearBy(
      keyword: string,
      center: [number, number],
      radius: number,
      callback: (status: string, result: {
        pois: Array<{
          name: string;
          location: LngLat;
          address: string;
        }>;
      }) => void
    ): void;
  }

  class Polyline {
    constructor(opts: {
      path: [number, number][];
      strokeColor?: string;
      strokeWeight?: number;
      strokeOpacity?: number;
      strokeStyle?: string;
      lineJoin?: string;
      showDir?: boolean;
      zIndex?: number;
    });
    setMap(map: Map | null): void;
    remove(): void;
  }

  class Walking {
    constructor(opts?: { map?: Map; hideMarkers?: boolean });
    search(
      origin: LngLat,
      destination: LngLat,
      callback: (status: string, result: { info?: { distance?: string; duration?: string } }) => void
    ): void;
    clear(): void;
  }

  class Riding {
    constructor(opts?: { map?: Map; hideMarkers?: boolean });
    search(
      origin: LngLat,
      destination: LngLat,
      callback: (status: string, result: { info?: { distance?: string; duration?: string } }) => void
    ): void;
    clear(): void;
  }

  class Driving {
    constructor(opts?: { map?: Map; hideMarkers?: boolean });
    search(
      origin: LngLat,
      destination: LngLat,
      callback: (status: string, result: { info?: { distance?: string; duration?: string } }) => void
    ): void;
    clear(): void;
  }
}

declare module "@amap/amap-jsapi-loader" {
  interface AMapLoaderOptions {
    key: string;
    version?: string;
    plugins?: string[];
    AMapUI?: {
      version?: string;
      plugins?: string[];
    };
    Loca?: {
      version?: string;
    };
  }
  function load(options: AMapLoaderOptions): Promise<typeof AMap>;
  export { load };
}
