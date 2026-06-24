import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const log = await db.gutLog.findFirst({
    where: { id, userId: session.user.id },
    include: { meals: true, symptoms: true, toilet: { select: { id: true, name: true } } },
  });

  if (!log) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: log.id,
      loggedAt: log.loggedAt.toISOString(),
      bristolScore: log.bristolScore,
      urgencyLevel: log.urgencyLevel,
      painLevel: log.painLevel,
      toiletId: log.toiletId,
      toiletName: log.toilet?.name ?? null,
      lat: log.lat,
      lng: log.lng,
      notes: log.notes,
      meals: log.meals.map((m) => ({
        foodName: m.foodName,
        category: m.category,
        portion: m.portion,
        mealTime: m.mealTime,
      })),
      symptoms: log.symptoms.map((s) => ({
        type: s.symptomType,
        severity: s.severity,
      })),
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.gutLog.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }

  const body = await request.json();
  const { loggedAt, bristolScore, urgencyLevel, painLevel, toiletId, notes, meals, symptoms } = body;

  // Delete old meals & symptoms, recreate
  await db.mealRecord.deleteMany({ where: { gutLogId: id } });
  await db.symptomRecord.deleteMany({ where: { gutLogId: id } });

  const updated = await db.gutLog.update({
    where: { id },
    data: {
      loggedAt: loggedAt ? new Date(loggedAt) : undefined,
      bristolScore: bristolScore ?? undefined,
      urgencyLevel: urgencyLevel ?? undefined,
      painLevel: painLevel ?? undefined,
      toiletId: toiletId ?? null,
      notes: notes ?? null,
      meals: {
        create: (meals || []).map((m: { foodName: string; category?: string; portion?: string; mealTime?: string }) => ({
          foodName: m.foodName,
          category: m.category || null,
          portion: m.portion || "medium",
          mealTime: m.mealTime || "snack",
        })),
      },
      symptoms: {
        create: (symptoms || []).map((s: { type: string; severity: number }) => ({
          symptomType: s.type,
          severity: s.severity,
        })),
      },
    },
    include: { meals: true, symptoms: true },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.gutLog.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }

  await db.gutLog.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" }, { status: 200 });
}
