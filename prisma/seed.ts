import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Load sample toilet data
  const samplePath = path.join(
    __dirname,
    "..",
    "data",
    "sample",
    "toilets-beijing.json"
  );

  if (!fs.existsSync(samplePath)) {
    console.log("⚠ No sample data found, skipping toilet seed.");
    return;
  }

  const toilets = JSON.parse(fs.readFileSync(samplePath, "utf-8"));

  let created = 0;
  for (const toilet of toilets) {
    const existing = await prisma.toilet.findFirst({
      where: {
        name: toilet.name,
        city: toilet.city,
      },
    });

    if (existing) {
      console.log(`  ⏭ Skipping existing: ${toilet.name}`);
      continue;
    }

    await prisma.toilet.create({
      data: {
        name: toilet.name,
        lat: toilet.lat,
        lng: toilet.lng,
        city: toilet.city,
        district: toilet.district,
        address: toilet.address,
        hasSquat: toilet.hasSquat,
        hasSeated: toilet.hasSeated,
        hasToiletPaper: toilet.hasToiletPaper,
        hasHandWash: toilet.hasHandWash,
        hasHandicap: toilet.hasHandicap,
        hasChangingTable: toilet.hasChangingTable,
        hasMirror: toilet.hasMirror,
        feeCents: toilet.feeCents,
        openingHours: toilet.openingHours,
        openingHoursType: toilet.openingHoursType ?? "unknown",
        dataSource: toilet.dataSource,
        sourceId: toilet.sourceId,
      },
    });

    created++;
    console.log(`  ✅ Created: ${toilet.name}`);
  }

  console.log(`\n🎉 Seeding complete: ${created} toilets created`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
