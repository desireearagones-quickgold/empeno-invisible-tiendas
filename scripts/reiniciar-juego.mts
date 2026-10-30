// Deja el juego como antes del sorteo: borra sorteo, pistas, regalos, reseñas,
// sesiones y avisos enviados. Los participantes NO se tocan.
// Uso: npx tsx scripts/reiniciar-juego.mts          (solo cuenta)
//      npx tsx scripts/reiniciar-juego.mts --borrar (borra)
import { config } from "dotenv";
config({ path: ".env.local" });
const { db } = await import("../src/db/client");
const { sql } = await import("drizzle-orm");

// Orden: primero lo que depende de otras tablas.
const TABLAS = ["review_comments", "review_ratings", "reviews", "gift_photos", "gifts", "ficha_opens", "fichas", "assignments", "sessions"];
const borrar = process.argv.includes("--borrar");

for (const t of TABLAS) {
  const [{ n }] = (await db.execute(sql.raw(`select count(*)::int as n from ${t}`))) as unknown as { n: number }[];
  if (borrar) await db.execute(sql.raw(`delete from ${t}`));
  console.log(`${t}: ${n}${borrar ? " borradas" : ""}`);
}
const filtroConfig = sql`key in ('sorteo_hecho', 'sorteo_fecha') or key like 'aviso:%'`;
const [{ n }] = (await db.execute(sql`select count(*)::int as n from config where ${filtroConfig}`)) as unknown as { n: number }[];
if (borrar) await db.execute(sql`delete from config where ${filtroConfig}`);
console.log(`config (sorteo y avisos): ${n}${borrar ? " borradas" : ""}`);
const [{ p }] = (await db.execute(sql`select count(*)::int as p from participants`)) as unknown as { p: number }[];
console.log(`participants: ${p} (se quedan)`);
process.exit(0);
