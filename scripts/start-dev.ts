/**
 * Dev startup: ensures PostgreSQL is running, then starts Next.js.
 * Usage: npx tsx scripts/start-dev.ts
 */
import { execSync, spawn } from "child_process";
import EmbeddedPostgres from "embedded-postgres";
import path from "path";
import fs from "fs";
import net from "net";

const PG_PORT = 5432;
const DATA_DIR = path.join(process.cwd(), ".pgdata");
const NEXT_PORT = 3000;

function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);
    socket.on("connect", () => { socket.destroy(); resolve(true); });
    socket.on("error", () => { socket.destroy(); resolve(false); });
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
    socket.connect(port, "127.0.0.1");
  });
}

async function ensurePostgres(): Promise<boolean> {
  // Already running?
  if (await isPortOpen(PG_PORT)) {
    console.log("✅ PostgreSQL already running on :5432");
    return true;
  }

  // Try to restart from existing data
  if (fs.existsSync(path.join(DATA_DIR, "PG_VERSION"))) {
    try {
      console.log("🐘 Restarting PostgreSQL from existing data...");
      const pg = new EmbeddedPostgres({
        databaseDir: DATA_DIR,
        port: PG_PORT,
        user: "opcwc",
        password: "opcwc",
        persistent: true,
      });
      await pg.start();
      console.log("✅ PostgreSQL restarted");
      return true;
    } catch {
      console.log("⚠ Restart failed, will reinitialize...");
      fs.rmSync(DATA_DIR, { recursive: true, force: true });
    }
  }

  // Fresh init
  try {
    console.log("🐘 Initializing PostgreSQL...");
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
    const pg = new EmbeddedPostgres({
      databaseDir: DATA_DIR,
      port: PG_PORT,
      user: "opcwc",
      password: "opcwc",
      persistent: true,
    });
    await pg.initialise();
    await pg.start();
    console.log("✅ PostgreSQL ready");

    // Create database
    try { await pg.createDatabase("opcwc"); } catch {}
    console.log("✅ Database 'opcwc' ready");
    return true;
  } catch (err) {
    console.error("❌ Failed to start PostgreSQL:", (err as Error).message);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting GutSafe dev environment...\n");

  // 1. Ensure PostgreSQL
  const pgReady = await ensurePostgres();
  if (!pgReady) {
    console.error("PostgreSQL is required. Exiting.");
    process.exit(1);
  }

  // Write .env for Prisma
  const envPath = path.join(process.cwd(), ".env");
  const dbUrl = "DATABASE_URL=\"postgresql://opcwc:opcwc@localhost:5432/opcwc?schema=public\"";
  fs.writeFileSync(envPath, dbUrl + "\n");

  // 2. Run migrations
  console.log("\n📦 Running database migrations...");
  try {
    execSync("npx prisma db push --skip-generate", { stdio: "pipe", cwd: process.cwd() });
    console.log("✅ Schema up to date");
  } catch (e) { console.log("⚠ Migration note:", (e as Error).message?.split("\n")[0]); }

  // 3. Seed if empty
  try {
    const { PrismaClient } = require("@prisma/client");
    const p = new PrismaClient();
    const count = await p.toilet.count();
    if (count === 0) {
      console.log("\n🌱 Seeding sample data...");
      execSync("npx tsx prisma/seed.ts", { stdio: "inherit", cwd: process.cwd() });
    } else {
      console.log(`\n📊 Database has ${count} toilets, skipping seed`);
    }
    await p.$disconnect();
  } catch {}

  // 4. Start Next.js
  console.log("\n⚡ Starting Next.js dev server...\n");
  const next = spawn("npx", ["next", "dev", "-p", String(NEXT_PORT)], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
    env: { ...process.env },
  });

  process.on("SIGINT", () => { next.kill(); process.exit(0); });
  process.on("SIGTERM", () => { next.kill(); process.exit(0); });
}

main().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});
