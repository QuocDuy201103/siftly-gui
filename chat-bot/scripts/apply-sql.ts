import fs from "fs";
import path from "path";
import postgres from "postgres";
import * as dotenv from "dotenv";

// Load environment variables from chat-bot/.env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sqlFileArg = process.argv[2];
if (!sqlFileArg) {
  console.error("Usage: npx tsx scripts/apply-sql.ts <path-to-sql-file>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (check chat-bot/.env.local)");
  process.exit(1);
}

const sqlFilePath = path.resolve(process.cwd(), sqlFileArg);
if (!fs.existsSync(sqlFilePath)) {
  console.error(`SQL file not found: ${sqlFilePath}`);
  process.exit(1);
}

const sqlText = fs.readFileSync(sqlFilePath, "utf8");
if (!sqlText.trim()) {
  console.error(`SQL file is empty: ${sqlFilePath}`);
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function run() {
  try {
    console.log(`Applying SQL: ${sqlFilePath}`);
    // Postgres.js can execute raw SQL via unsafe
    await sql.unsafe(sqlText);
    console.log("✅ Done");
  } catch (err) {
    console.error("❌ Failed to apply SQL:", err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

run();


