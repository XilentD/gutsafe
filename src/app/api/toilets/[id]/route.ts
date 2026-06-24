import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const toilet = await db.toilet.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!toilet) {
      return NextResponse.json(
        { error: "Toilet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: toilet });
  } catch (error) {
    console.error("Toilet detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch toilet" },
      { status: 500 }
    );
  }
}
