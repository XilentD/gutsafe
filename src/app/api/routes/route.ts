import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { planRoute } from "@/server/route-planner";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(20, parseInt(searchParams.get("pageSize") || "20", 10));

  const [routes, total] = await Promise.all([
    db.route.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        startName: true,
        endName: true,
        totalDistanceMeters: true,
        toiletCount: true,
        safetyScore: true,
        isPublic: true,
        createdAt: true,
      },
    }),
    db.route.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({
    data: routes,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, start, end, maxToiletDistance, planResult, isPublic } = body;

    if (!start || !end) {
      return NextResponse.json(
        { error: "Start and end are required" },
        { status: 400 }
      );
    }

    // Run the plan to compute results
    const result = await planRoute({
      startLat: start.lat,
      startLng: start.lng,
      startName: start.name || planResult?.start?.name,
      endLat: end.lat,
      endLng: end.lng,
      endName: end.name || planResult?.end?.name,
      maxToiletDistance: maxToiletDistance || 500,
    });

    const saved = await db.route.create({
      data: {
        userId: session.user.id,
        name: name || `${result.start.name} → ${result.end.name}`,
        startName: result.start.name,
        startLat: result.start.lat,
        startLng: result.start.lng,
        endName: result.end.name,
        endLat: result.end.lat,
        endLng: result.end.lng,
        maxToiletDistanceMeters: maxToiletDistance || 500,
        totalDistanceMeters: result.totalDistanceMeters,
        estimatedDurationMin: result.estimatedDurationMinutes,
        toiletCount: result.toilets.length,
        toiletDensity: result.toiletDensity,
        maxGapMeters: result.maxGapMeters,
        safetyScore: result.safetyScore,
        waypointsGeojson: JSON.parse(JSON.stringify(result.toilets)),
        isPublic: isPublic || false,
      },
    });

    return NextResponse.json({ data: saved }, { status: 201 });
  } catch (error) {
    console.error("Save route error:", error);
    return NextResponse.json(
      { error: "Failed to save route" },
      { status: 500 }
    );
  }
}
