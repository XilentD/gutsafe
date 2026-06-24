import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { normalize } from "./scrape/normalize";
import { deduplicate } from "./scrape/deduplicate";

const p = new PrismaClient();

async function main() {
  const rawDir = path.join(process.cwd(), "data", "raw");
  const files = fs.readdirSync(rawDir).filter(f => f.endsWith(".json") && !f.includes("北京") && !f.includes("gaode"));
  
  if (files.length === 0) { console.log("No files to import"); return; }
  
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(rawDir, file), "utf8"));
    console.log(`\n📄 ${file}: ${data.length} records`);
    
    const normalized = normalize(data);
    const deduped = deduplicate(normalized);
    
    let created = 0, skipped = 0;
    for (const r of deduped) {
      const exists = await p.toilet.findFirst({ where: { name: r.name, city: r.city, lat: r.lat, lng: r.lng } });
      if (exists) { skipped++; continue; }
      await p.toilet.create({
        data: {
          name: r.name, lat: r.lat, lng: r.lng, address: r.address, city: r.city, district: r.district,
          hasSquat: r.hasSquat, hasSeated: r.hasSeated, hasToiletPaper: r.hasToiletPaper,
          hasHandWash: r.hasHandWash, hasHandicap: r.hasHandicap, hasChangingTable: r.hasChangingTable,
          hasMirror: r.hasMirror, feeCents: r.feeCents, feeDescription: r.feeDescription,
          openingHours: r.openingHours, openingHoursType: r.openingHoursType,
          dataSource: r.dataSource, sourceId: r.sourceId?.substring(0, 255),
        },
      });
      created++;
    }
    console.log(`  ✅ Created: ${created}, ⏭ Skipped: ${skipped}`);
  }
  await p.$disconnect();
}
main();
