/**
 * Proxy Gaode Directions API through our server to use the Web API key securely.
 * GET /api/directions?mode=walking&origin=116.3,39.9&destination=116.4,39.91
 */
import { NextRequest, NextResponse } from "next/server";

const GAODE_KEY = process.env.GAODE_WEB_API_KEY || "";
const BASE_URL = "https://restapi.amap.com/v3/direction";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "walking";
    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");

    if (!origin || !destination) {
      return NextResponse.json({ error: "origin and destination required" }, { status: 400 });
    }
    if (!GAODE_KEY) {
      return NextResponse.json({ error: "GAODE_WEB_API_KEY not configured" }, { status: 500 });
    }

    const url = `${BASE_URL}/${mode}?key=${GAODE_KEY}&origin=${origin}&destination=${destination}&output=JSON`;

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: `Gaode API ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
