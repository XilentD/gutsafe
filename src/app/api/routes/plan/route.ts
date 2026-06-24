import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { planRoute } from "@/server/route-planner";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { start, end, maxToiletDistance } = body;

    if (!start?.lng || !start?.lat || !end?.lng || !end?.lat) {
      return NextResponse.json(
        { error: "Start and end coordinates are required" },
        { status: 400 }
      );
    }

    const result = await planRoute({
      startLat: start.lat,
      startLng: start.lng,
      startName: start.name,
      endLat: end.lat,
      endLng: end.lng,
      endName: end.name,
      maxToiletDistance: maxToiletDistance || 500,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Route planning error:", error);
    return NextResponse.json(
      { error: "Failed to plan route" },
      { status: 500 }
    );
  }
}
