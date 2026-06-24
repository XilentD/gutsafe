/**
 * Proxy Gaode Directions API through our server to use the Web API key securely.
 * GET /api/directions?mode=walking&origin=116.3,39.9&destination=116.4,39.91
 */
import { NextRequest, NextResponse } from "next/server";

const GAODE_KEY = process.env.GAODE_WEB_API_KEY || "";
const V3_BASE = "https://restapi.amap.com/v3/direction";
const V4_BASE = "https://restapi.amap.com/v4/direction";

// Frontend uses "riding", bicycling needs v4 API
const MODE_CONFIG: Record<string, { path: string; version: "v3" | "v4" }> = {
  walking: { path: "walking", version: "v3" },
  riding:  { path: "bicycling", version: "v4" },
  driving: { path: "driving", version: "v3" },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "walking";
    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");

    if (!origin || !destination) {
      return NextResponse.json({ error: "origin and destination required" }, { status: 400 });
    }

    const config = MODE_CONFIG[mode];
    if (!config) {
      return NextResponse.json({ error: `Invalid mode: ${mode}` }, { status: 400 });
    }

    if (!GAODE_KEY) {
      return NextResponse.json({ error: "GAODE_WEB_API_KEY not configured" }, { status: 500 });
    }

    const base = config.version === "v4" ? V4_BASE : V3_BASE;
    const params = new URLSearchParams({ key: GAODE_KEY, origin, destination, output: "JSON" });
    const url = `${base}/${config.path}?${params}`;

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: `Gaode API ${res.status}` }, { status: 502 });
    }

    // v4 returns { data: { paths } }, v3 returns { status, route: { paths } }
    // Normalize both to { status: "1", route: { paths } }
    const raw = await res.json();
    const data = config.version === "v4"
      ? { status: raw.data ? "1" : "0", route: { paths: raw.data?.paths || [] } }
      : raw;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
