import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/shared/schema";

let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export async function connectDb() {
    if (db) {
        return db;
    }

    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set. Please set it in your environment variables.");
    }

    try {
        // Disable prefetch as it's not supported for "Transaction" pool mode
        client = postgres(process.env.DATABASE_URL, { prepare: false });
        db = drizzle(client, { schema });
        console.log("Supabase PostgreSQL connected successfully");
        return db;
    } catch (error) {
        console.error("Supabase PostgreSQL connection error:", error);
        throw error;
    }
}

export function getDb() {
    if (!db) {
        throw new Error("Database not connected. Call connectDb() first.");
    }
    return db;
}
