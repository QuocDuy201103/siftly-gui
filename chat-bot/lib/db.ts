import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../shared/schema";

let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export async function connectDb() {
  if (db && client) {
    return db;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  try {
    client = postgres(process.env.DATABASE_URL, { prepare: false });
    db = drizzle(client, { schema });
    console.log("Database connected successfully");
    return db;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error("Database not connected. Call connectDb() first.");
  }
  return db;
}

export function getPostgresClient() {
  if (!client) {
    throw new Error("Database not connected. Call connectDb() first.");
  }
  return client;
}

