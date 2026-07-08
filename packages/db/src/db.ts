import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@host.docker.internal:5433/water_delivery";

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export async function closeDb(): Promise<void> {
  await client.end();
}