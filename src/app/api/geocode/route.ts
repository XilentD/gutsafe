import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Simple geocoding API.
 * Searches for a location by matching toilet names and addresses
 * in our database. Falls back to known landmarks.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") || "";
  const city = searchParams.get("city") || "";

  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  try {
    // Search toilets matching the address
    const match = await db.toilet.findFirst({
      where: {
        OR: [
          { name: { contains: address } },
          { address: { contains: address } },
        ],
        ...(city ? { city } : {}),
      },
      select: { lat: true, lng: true, name: true },
      orderBy: { reviewCount: "desc" },
    });

    if (match) {
      return NextResponse.json({
        data: { lat: match.lat, lng: match.lng },
        name: match.name,
      });
    }

    // Fallback: return Beijing center
    return NextResponse.json({
      data: { lat: 39.90923, lng: 116.397428 },
      name: address,
      fallback: true,
    });
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json(
      { data: { lat: 39.90923, lng: 116.397428 }, fallback: true }
    );
  }
}
