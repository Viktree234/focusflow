import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Cache connection in dev to avoid exhausting Aiven connection limits during HMR
const globalForDb = globalThis as { conn?: postgres.Sql };

const conn =
  globalForDb.conn ??
  postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
