import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { computeInsights } from "@/server/correlation-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const insights = await computeInsights(session.user.id, from, to);

    return NextResponse.json({ data: insights });
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json(
      { error: "Failed to compute insights" },
      { status: 500 }
    );
  }
}
