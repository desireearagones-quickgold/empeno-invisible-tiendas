import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL (la conexión a Postgres).");
}

// prepare: false porque Neon usa un pooler (pgbouncer) en modo transacción,
// que no es compatible con sentencias preparadas (lo pide la propia Neon).
const sql = postgres(connectionString, { ssl: "require", prepare: false });

export const db = drizzle(sql, { schema });
export { sql };
