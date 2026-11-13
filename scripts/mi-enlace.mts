// Enseña el enlace personal de la organizadora (el primer teléfono de
// ADMIN_PHONES) para entrar al panel de las tiendas.
// Uso: npx tsx scripts/mi-enlace.mts
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
const { db } = await import("../src/db/client");
const { participants } = await import("../src/db/schema");
const { eq } = await import("drizzle-orm");

const telefono = (process.env.ADMIN_PHONES ?? "").split(",")[0].replace(/[^0-9]/g, "");
const [yo] = await db.select().from(participants).where(eq(participants.phone, telefono));
if (!yo) {
  console.log("No estás dada de alta como organizadora en la base de datos de las tiendas.");
} else {
  console.log(`\nTu enlace (no lo compartas: entra como tú):\nhttps://amigoinvisible-tiendas.quickgold.es/api/acceso/${yo.accessToken}\n`);
  console.log("Después de entrar, el panel está en https://amigoinvisible-tiendas.quickgold.es/admin\n");
}
process.exit(0);
