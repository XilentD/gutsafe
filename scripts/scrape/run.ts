/**
 * Main scraping pipeline runner.
 * 1. Scrape OSM Overpass API
 * 2. Scrape Gaode POI API
 * 3. Normalize & deduplicate
 * 4. Upsert into database
 *
 * Usage:
 *   npx tsx scripts/scrape/run.ts --city 北京
 *   npx tsx scripts/scrape/run.ts --city 北京 --source osm     # OSM only
 *   npx tsx scripts/scrape/run.ts --city 北京 --source gaode   # Gaode only
 *   npx tsx scripts/scrape/run.ts --city 北京 --dry-run        # No DB insert
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load env BEFORE dynamic imports — ESM hoists static imports,
// so gaode.ts would read process.env before config() runs.
// We load env here, then use dynamic import() for the scrapers.
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { normalize, type NormalizedToilet } from "./normalize";
import { deduplicate } from "./deduplicate";

const prisma = new PrismaClient();

interface RunOptions {
  city: string;
  sources: string[];
  dryRun: boolean;
}

function parseArgs(): RunOptions {
  const args = process.argv.slice(2);
  const city = args.find((a) => a.startsWith("--city="))?.split("=")[1] || "北京";
  const sourceArg = args.find((a) => a.startsWith("--source="));
  const sources = sourceArg?.split("=")[1]?.split(",") || ["osm", "gaode"];
  const dryRun = args.includes("--dry-run");
  return { city, sources, dryRun };
}

async function upsertToilets(records: NormalizedToilet[]): Promise<{
  created: number;
  updated: number;
  skipped: number;
}> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      // Data is already spatially deduplicated. Just insert with a uniqueness
      // check by name + city + sourceId
      const existing = await prisma.toilet.findFirst({
        where: {
          name: record.name,
          city: record.city,
          lat: record.lat,
          lng: record.lng,
        },
      });

      if (existing) {
        // Merge: update with new attributes if we have better data
        const updates: Record<string, unknown> = {};
        if (record.openingHours && !existing.openingHours) {
          updates.openingHours = record.openingHours;
          updates.openingHoursType = record.openingHoursType;
        }
        if (record.hasToiletPaper && !existing.hasToiletPaper) {
          updates.hasToiletPaper = true;
        }
        if (record.hasSquat && !existing.hasSquat) {
          updates.hasSquat = true;
        }
        if (record.hasHandicap && !existing.hasHandicap) {
          updates.hasHandicap = true;
        }
        if (record.hasChangingTable && !existing.hasChangingTable) {
          updates.hasChangingTable = true;
        }
        if (record.address && !existing.address) {
          updates.address = record.address;
        }
        if (record.district && !existing.district) {
          updates.district = record.district;
        }

        if (Object.keys(updates).length > 0) {
          await prisma.toilet.update({
            where: { id: existing.id },
            data: updates,
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Create new
        await prisma.toilet.create({
          data: {
            name: record.name,
            lat: record.lat,
            lng: record.lng,
            address: record.address,
            city: record.city,
            district: record.district,
            hasSquat: record.hasSquat,
            hasSeated: record.hasSeated,
            hasToiletPaper: record.hasToiletPaper,
            hasHandWash: record.hasHandWash,
            hasHandicap: record.hasHandicap,
            hasChangingTable: record.hasChangingTable,
            hasMirror: record.hasMirror,
            feeCents: record.feeCents,
            feeDescription: record.feeDescription,
            openingHours: record.openingHours,
            openingHoursType: record.openingHoursType,
            dataSource: record.dataSource,
            sourceId: record.sourceId?.substring(0, 255),
            rawAttributes: record.rawAttributes ? JSON.parse(JSON.stringify(record.rawAttributes)) : undefined,
          },
        });
        created++;
      }
    } catch (err) {
      console.error(`   ❌ Error upserting "${record.name}":`, (err as Error).message);
      skipped++;
    }
  }

  return { created, updated, skipped };
}

async function main() {
  const { city, sources, dryRun } = parseArgs();
  console.log(`🚀 Starting scrape pipeline for: ${city}`);
  console.log(`   Sources: ${sources.join(", ")}`);
  console.log(`   Mode: ${dryRun ? "DRY RUN (no DB)" : "LIVE (will upsert to DB)"}`);
  console.log("");

  const allRecords: NormalizedToilet[] = [];

  // OSM — dynamic import so env is loaded first
  if (sources.includes("osm")) {
    try {
      const { scrapeOsm } = await import("./osm");
      const osmRecords = await scrapeOsm(city);
      const normalized = normalize(osmRecords);
      console.log(`   ✅ OSM: ${normalized.length} normalized records`);
      allRecords.push(...normalized);
    } catch (err) {
      console.error(`   ❌ OSM scrape failed:`, (err as Error).message);
    }
  }

  // Gaode — dynamic import so env is loaded first
  if (sources.includes("gaode")) {
    try {
      const { scrapeGaode } = await import("./gaode");
      const gaodeRecords = await scrapeGaode(city);
      const normalized = normalize(gaodeRecords);
      console.log(`   ✅ Gaode: ${normalized.length} normalized records`);
      allRecords.push(...normalized);
    } catch (err) {
      console.error(`   ❌ Gaode scrape failed:`, (err as Error).message);
    }
  }

  console.log(`\n📊 Total raw records: ${allRecords.length}`);

  if (allRecords.length === 0) {
    console.log("   No records to process. Exiting.");
    return;
  }

  // Deduplicate
  const deduped = deduplicate(allRecords);

  // Save to file for inspection
  const outputDir = path.join(process.cwd(), "data", "processed");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `toilets-${city}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deduped, null, 2));
  console.log(`💾 Saved processed data to ${outputPath}`);

  // Upsert to DB
  if (!dryRun) {
    console.log(`\n📦 Upserting ${deduped.length} records to database...`);
    const result = await upsertToilets(deduped);
    console.log(`   ✅ Created: ${result.created}`);
    console.log(`   🔄 Updated: ${result.updated}`);
    console.log(`   ⏭ Skipped: ${result.skipped}`);

    // Log job
    try {
      await prisma.dataImportJob.create({
        data: {
          dataSource: sources.join(","),
          city,
          status: "completed",
          totalFetched: allRecords.length,
          totalNew: result.created,
          totalUpdated: result.updated,
          totalDuplicates: result.skipped,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
    } catch {
      // data_import_jobs table might not exist yet, ignore
    }
  } else {
    console.log(`\n🔍 Dry run — skipped DB upsert`);
  }

  console.log(`\n🎉 Pipeline complete!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
