import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, lng, lat, city, address, hasSquat, hasSeated, hasToiletPaper, hasHandWash, hasHandicap, hasChangingTable, hasMirror, feeCents, openingHours, dataSource } = body;

    if (!name || !lng || !lat || !city) {
      return NextResponse.json({ error: "name, lng, lat, and city are required" }, { status: 400 });
    }

    const toilet = await db.toilet.create({
      data: {
        name,
        lng: parseFloat(lng),
        lat: parseFloat(lat),
        city,
        address: address || null,
        hasSquat: hasSquat || false,
        hasSeated: hasSeated || false,
        hasToiletPaper: hasToiletPaper || false,
        hasHandWash: hasHandWash || false,
        hasHandicap: hasHandicap || false,
        hasChangingTable: hasChangingTable || false,
        hasMirror: hasMirror || false,
        feeCents: feeCents || 0,
        openingHours: openingHours || null,
        openingHoursType: openingHours ? "scheduled" : "unknown",
        dataSource: dataSource || "user",
        verified: false,
      },
    });

    return NextResponse.json({ data: toilet }, { status: 201 });
  } catch (error) {
    console.error("Create toilet error:", error);
    return NextResponse.json({ error: "Failed to create toilet" }, { status: 500 });
  }
}
