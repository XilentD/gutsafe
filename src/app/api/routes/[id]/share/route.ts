import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const route = await db.route.findUnique({ where: { id } });

    if (!route || route.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const shareToken = route.shareToken || crypto.randomBytes(16).toString("hex");

    if (!route.shareToken) {
      await db.route.update({
        where: { id },
        data: { shareToken, isPublic: true },
      });
    }

    const shareUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/share/${shareToken}`;

    return NextResponse.json({
      data: { shareToken, shareUrl },
    });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json({ error: "Share failed" }, { status: 500 });
  }
}
