import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { haversineDistance } from "@/lib/coord-convert";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const radius = Math.min(
      parseInt(searchParams.get("radius") || "1000", 10),
      5000
    );
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)),
      50
    );
    const sortBy = searchParams.get("sortBy") || "distance";

    // Filters
    const hasSquat = searchParams.get("hasSquat");
    const hasToiletPaper = searchParams.get("hasToiletPaper");
    const hasHandicap = searchParams.get("hasHandicap");
    const isFree = searchParams.get("isFree");
    const minCleanliness = searchParams.get("minCleanliness");

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "lat and lng are required" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {};

    if (hasSquat === "true") where.hasSquat = true;
    if (hasSquat === "false") where.hasSquat = false;
    if (hasToiletPaper === "true") where.hasToiletPaper = true;
    if (hasToiletPaper === "false") where.hasToiletPaper = false;
    if (hasHandicap === "true") where.hasHandicap = true;
    if (hasHandicap === "false") where.hasHandicap = false;
    if (isFree === "true") where.feeCents = 0;
    if (isFree === "false") where.feeCents = { gt: 0 };
    if (minCleanliness) {
      where.avgCleanliness = { gte: parseFloat(minCleanliness) };
    }

    // Fetch all toilets (we'll do distance filtering in-memory for dev)
    // In production with PostGIS: use ST_DWithin in raw SQL
    const toilets = await db.toilet.findMany({
      where,
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
        address: true,
        hasSquat: true,
        hasSeated: true,
        hasToiletPaper: true,
        hasHandWash: true,
        hasHandicap: true,
        feeCents: true,
        avgCleanliness: true,
        reviewCount: true,
        avgQueueMin: true,
        openingHoursType: true,
      },
    });

    // Compute distances and filter by radius (in-memory Haversine)
    const center = { lng, lat };
    const withDistance = toilets
      .map((t) => ({
        ...t,
        distance: haversineDistance(center, { lng: t.lng, lat: t.lat }),
      }))
      .filter((t) => t.distance <= radius);

    // Sort
    if (sortBy === "cleanliness") {
      withDistance.sort((a, b) => (b.avgCleanliness || 0) - (a.avgCleanliness || 0));
    } else if (sortBy === "reviewCount") {
      withDistance.sort((a, b) => b.reviewCount - a.reviewCount);
    } else {
      withDistance.sort((a, b) => a.distance - b.distance);
    }

    // Paginate
    const total = withDistance.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = withDistance.slice(start, start + pageSize);

    return NextResponse.json({
      data,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (error) {
    console.error("Nearby toilets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch toilets" },
      { status: 500 }
    );
  }
}
