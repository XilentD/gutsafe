/**
 * Development database launcher using embedded-postgres.
 * Starts a local PostgreSQL instance without Docker.
 * Usage: npx tsx scripts/dev-db.ts
 */
import EmbeddedPostgres from "embedded-postgres";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".pgdata");
const DB_NAME = "opcwc";
const DB_USER = "opcwc";
const DB_PASSWORD = "opcwc";
const DB_PORT = 5432;
const DB_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}?schema=public`;

async function main() {
  console.log("🐘 Starting embedded PostgreSQL...");

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    persistent: true,
    onLog: (msg) => {
      // Only log non-routine messages
      if (msg.includes("ERROR") || msg.includes("FATAL")) {
        console.log(`  [pg] ${msg.trim()}`);
      }
    },
  });

  // Initialize cluster if first run
  await pg.initialise();
  console.log("   Cluster initialized");

  // Start PostgreSQL
  await pg.start();
  console.log(`✅ PostgreSQL running at localhost:${DB_PORT}`);

  // Create database if not exists
  try {
    await pg.createDatabase(DB_NAME);
    console.log(`   Database "${DB_NAME}" created`);
  } catch {
    console.log(`   Database "${DB_NAME}" already exists`);
  }

  // Write .env.local with the connection string
  const envPath = path.join(process.cwd(), ".env.local");
  const fs = await import("fs");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
    // Replace existing DATABASE_URL
    if (envContent.includes("DATABASE_URL=")) {
      envContent = envContent.replace(
        /DATABASE_URL=.*/,
        `DATABASE_URL="${DB_URL}"`
      );
    } else {
      envContent += `\nDATABASE_URL="${DB_URL}"\n`;
    }
  } else {
    envContent = `DATABASE_URL="${DB_URL}"\n`;
  }
  fs.writeFileSync(envPath, envContent);
  console.log("   .env.local updated with DATABASE_URL");

  console.log(`\n📦 Run database migrations with:`);
  console.log(`   npx prisma migrate dev --name init`);
  console.log(`\n🌱 Seed sample data:`);
  console.log(`   npx tsx prisma/seed.ts`);

  console.log(`\n🎉 Database ready! The server will stay running.`);
  console.log(`   Press Ctrl+C to shut down.\n`);

  // Keep alive
  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down PostgreSQL...");
    await pg.stop();
    console.log("   Done.");
    process.exit(0);
  });
}

main().catch(async (err) => {
  console.error("❌ Failed to start database:", err);
  process.exit(1);
});
