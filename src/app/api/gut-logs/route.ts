import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(20, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (from || to) {
    const loggedAt: Record<string, Date> = {};
    if (from) loggedAt.gte = new Date(from);
    if (to) loggedAt.lte = new Date(to);
    where.loggedAt = loggedAt;
  }

  const [logs, total] = await Promise.all([
    db.gutLog.findMany({
      where,
      include: {
        meals: true,
        symptoms: true,
        toilet: { select: { id: true, name: true } },
      },
      orderBy: { loggedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.gutLog.count({ where }),
  ]);

  const data = logs.map((log) => ({
    id: log.id,
    loggedAt: log.loggedAt.toISOString(),
    bristolScore: log.bristolScore,
    urgencyLevel: log.urgencyLevel,
    painLevel: log.painLevel,
    toiletId: log.toiletId,
    toiletName: log.toilet?.name ?? null,
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
  }));

  return NextResponse.json({
    data,
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
    const {
      loggedAt,
      bristolScore,
      urgencyLevel,
      painLevel,
      toiletId,
      location,
      notes,
      meals,
      symptoms,
    } = body;

    if (!bristolScore || !urgencyLevel || painLevel === undefined) {
      return NextResponse.json(
        { error: "bristolScore, urgencyLevel, and painLevel are required" },
        { status: 400 }
      );
    }

    const log = await db.gutLog.create({
      data: {
        userId: session.user.id,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
        bristolScore,
        urgencyLevel,
        painLevel,
        toiletId: toiletId || null,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        notes: notes || null,
        meals: {
          create: (meals || []).map((m: { foodName: string; category?: string; portion?: string; mealTime?: string; hoursBeforeLog?: number }) => ({
            foodName: m.foodName,
            category: m.category || null,
            portion: m.portion || "medium",
            mealTime: m.mealTime || "snack",
            hoursBeforeLog: m.hoursBeforeLog || null,
          })),
        },
        symptoms: {
          create: (symptoms || []).map((s: { type: string; severity: number }) => ({
            symptomType: s.type,
            severity: s.severity,
          })),
        },
      },
      include: {
        meals: true,
        symptoms: true,
      },
    });

    return NextResponse.json({ data: log }, { status: 201 });
  } catch (error) {
    console.error("Create gut log error:", error);
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
  }
}
