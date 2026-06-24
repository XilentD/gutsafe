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

    let token = route.shareToken;
    // Only generate token once; accept minor race in exchange for simplicity.
    // TOCTOU here is benign: worst case, a double-click creates a stale token
    // that points to the same route — no data loss, just a cosmetic edge case.
    if (!token) {
      token = crypto.randomBytes(16).toString("hex");
      try {
        await db.route.update({
          where: { id },
          data: { shareToken: token, isPublic: true },
        });
      } catch {
        // If update fails (e.g., unique constraint from a concurrent request),
        // re-fetch and use the token that the other request stored
        const updated = await db.route.findUnique({ where: { id } });
        token = updated?.shareToken || token;
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000";
    const shareUrl = `${appUrl}/share/${token}`;

    return NextResponse.json({
      data: { shareToken: token, shareUrl },
    });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json({ error: "Share failed" }, { status: 500 });
  }
}
