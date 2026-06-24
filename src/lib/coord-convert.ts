/**
 * Coordinate system conversion utilities.
 *
 * All database storage uses WGS-84 (GPS coordinates).
 * Gaode (高德) map tiles use GCJ-02 (Chinese national encryption).
 * Frontend map layer handles GCJ-02 conversion; all API I/O is WGS-84.
 */
import coordtransform from "coordtransform";

export type Coord = {
  lng: number;
  lat: number;
};

/**
 * Convert WGS-84 (GPS) coordinates to GCJ-02 (Gaode/Baidu map).
 * Use this ONLY in the frontend map layer when placing markers on Gaode tiles.
 */
export function wgs84ToGcj02(coord: Coord): Coord {
  // Guard against NaN/infinite inputs
  if (!Number.isFinite(coord.lng) || !Number.isFinite(coord.lat)) {
    return { lng: NaN, lat: NaN };
  }
  const result = coordtransform.wgs84togcj02(coord.lng, coord.lat);
  return { lng: result[0], lat: result[1] };
}

/**
 * Convert GCJ-02 coordinates back to WGS-84.
 * Use this when ingesting data from Gaode API into the database.
 */
export function gcj02ToWgs84(coord: Coord): Coord {
  if (!Number.isFinite(coord.lng) || !Number.isFinite(coord.lat)) {
    return { lng: NaN, lat: NaN };
  }
  const result = coordtransform.gcj02towgs84(coord.lng, coord.lat);
  return { lng: result[0], lat: result[1] };
}

/**
 * Convert WGS-84 coordinates to BD-09 (Baidu map).
 * Two-step: WGS-84 → GCJ-02 → BD-09
 */
export function wgs84ToBd09(coord: Coord): Coord {
  const gcj = coordtransform.wgs84togcj02(coord.lng, coord.lat);
  return gcj02ToBd09({ lng: gcj[0], lat: gcj[1] });
}

/**
 * Convert BD-09 coordinates to WGS-84.
 * Two-step: BD-09 → GCJ-02 → WGS-84
 */
export function bd09ToWgs84(coord: Coord): Coord {
  const gcj = coordtransform.bd09togcj02(coord.lng, coord.lat);
  return gcj02ToWgs84({ lng: gcj[0], lat: gcj[1] });
}

/**
 * Convert GCJ-02 to BD-09.
 */
export function gcj02ToBd09(coord: Coord): Coord {
  const result = coordtransform.gcj02tobd09(coord.lng, coord.lat);
  return { lng: result[0], lat: result[1] };
}

/**
 * Convert BD-09 to GCJ-02.
 */
export function bd09ToGcj02(coord: Coord): Coord {
  const result = coordtransform.bd09togcj02(coord.lng, coord.lat);
  return { lng: result[0], lat: result[1] };
}

/**
 * Haversine distance between two WGS-84 coordinates (in meters).
 * Does not require PostGIS — useful for client-side distance approximation.
 */
export function haversineDistance(a: Coord, b: Coord): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aLat = (a.lat * Math.PI) / 180;
  const bLat = (b.lat * Math.PI) / 180;
  const h =
    sinDLat * sinDLat + Math.cos(aLat) * Math.cos(bLat) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}
