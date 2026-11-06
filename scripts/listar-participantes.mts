// Lista los participantes (nombre, teléfono, id). Solo lee.
import { config } from "dotenv";
config({ path: ".env.local" });
const { db } = await import("../src/db/client");
const { participants } = await import("../src/db/schema");
const filas = await db.select().from(participants);
filas.sort((a, b) => a.name.localeCompare(b.name, "es"));
for (const p of filas) console.log([p.name, p.phone, p.id, p.email ?? ""].join("\t"));
console.log(filas.length, "personas");
process.exit(0);
