import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ToiletDetailView } from "./ToiletDetailView";
import type { ToiletDetail } from "@/types/toilet";

async function getToilet(id: string): Promise<ToiletDetail | null> {
  const toilet = await db.toilet.findUnique({
    where: { id },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: { name: true, image: true },
          },
        },
      },
    },
  });

  if (!toilet) return null;

  return {
    id: toilet.id,
    name: toilet.name,
    lng: toilet.lng,
    lat: toilet.lat,
    address: toilet.address,
    city: toilet.city,
    district: toilet.district,
    hasSquat: toilet.hasSquat,
    hasSeated: toilet.hasSeated,
    hasToiletPaper: toilet.hasToiletPaper,
    hasHandWash: toilet.hasHandWash,
    hasHandicap: toilet.hasHandicap,
    hasChangingTable: toilet.hasChangingTable,
    hasMirror: toilet.hasMirror,
    feeCents: toilet.feeCents,
    feeDescription: toilet.feeDescription,
    openingHours: toilet.openingHours,
    openingHoursType: toilet.openingHoursType as "24h" | "scheduled" | "unknown",
    avgQueueMin: toilet.avgQueueMin,
    avgCleanliness: toilet.avgCleanliness,
    reviewCount: toilet.reviewCount,
    dataSource: toilet.dataSource,
    verified: toilet.verified,
    reviews: toilet.reviews.map((r) => ({
      id: r.id,
      cleanliness: r.cleanliness,
      queueMinutes: r.queueMinutes,
      hasTissue: r.hasTissue,
      isFunctioning: r.isFunctioning,
      comment: r.comment,
      visitedAt: r.visitedAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      user: { name: r.user.name, image: r.user.image },
    })),
    createdAt: toilet.createdAt.toISOString(),
    updatedAt: toilet.updatedAt.toISOString(),
  };
}

export default async function ToiletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const toilet = await getToilet(id);

  if (!toilet) {
    notFound();
  }

  return <ToiletDetailView toilet={toilet} />;
}
