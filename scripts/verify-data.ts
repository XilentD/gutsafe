import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const count = await p.toilet.count();
  console.log("Total toilets:", count);
  
  const byCity = await p.toilet.groupBy({ by: ["city"], _count: true });
  console.log("By city:", byCity);
  
  const bySource = await p.toilet.groupBy({ by: ["dataSource"], _count: true });
  console.log("By source:", bySource);
  
  const sample = await p.toilet.findMany({ 
    take: 5, 
    select: { name: true, city: true, dataSource: true, lat: true, lng: true } 
  });
  console.log("Sample:", sample);
  
  await p.$disconnect();
}
main();
