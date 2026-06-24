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
  const route = await db.route.findFirst({
    where: { id, userId: session.user.id },
    include: {
      routeToilets: {
        orderBy: { sequenceOrder: "asc" },
        include: {
          toilet: {
            select: {
              id: true,
              name: true,
              lat: true,
              lng: true,
              hasSquat: true,
              hasToiletPaper: true,
              avgCleanliness: true,
              address: true,
            },
          },
        },
      },
    },
  });

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  return NextResponse.json({ data: route });
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
  const route = await db.route.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  await db.route.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" }, { status: 200 });
}
