import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  await p.routeToilet.deleteMany();
  await p.toiletReview.deleteMany();
  await p.gutLog.deleteMany();
  await p.toilet.deleteMany();
  console.log("Toilets cleared");
  await p.$disconnect();
}
main();
