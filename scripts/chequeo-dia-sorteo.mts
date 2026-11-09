// Repaso antes de lanzar el sorteo. Solo lee: base de datos, web y Meta.
import { config as dotenv } from "dotenv";
dotenv({ path: ".env.local" });
const { db } = await import("../src/db/client");
const { sql } = await import("drizzle-orm");
const n = async (q: string) => ((await db.execute(sql.raw(q))) as unknown as { n: number }[])[0].n;
console.log("participantes:", await n("select count(*)::int n from participants"));
console.log("sin teléfono:", await n("select count(*)::int n from participants where phone is null or phone = ''"));
console.log("teléfonos raros:", await n("select count(*)::int n from participants where phone !~ '^34[67][0-9]{8}$'"));
console.log("asignaciones:", await n("select count(*)::int n from assignments"));
console.log("config sorteo/aviso:", await n("select count(*)::int n from config where key in ('sorteo_hecho','sorteo_fecha') or key like 'aviso:%'"));
console.log("fichas/regalos/reseñas:", await n("select count(*)::int n from fichas"), await n("select count(*)::int n from gifts"), await n("select count(*)::int n from reviews"));
const app = "https://amigoinvisible.quickgold.es";
for (const r of ["/", "/whatsapp-cabecera.png", "/api/admin/whatsapp-sorteo"]) {
  const res = await fetch(app + r);
  console.log("web", r, res.status, res.headers.get("content-type"));
}
const t = process.env.WHATSAPP_ACCESS_TOKEN;
const pl = await (await fetch(`https://graph.facebook.com/v21.0/1427240335612128/message_templates?name=ventanilla_abierta&fields=name,status,language,category`, { headers: { Authorization: `Bearer ${t}` } })).json();
console.log("plantilla:", JSON.stringify(pl.data ?? pl));
const num = await (await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier,status,name_status`, { headers: { Authorization: `Bearer ${t}` } })).json();
console.log("número:", JSON.stringify(num));
process.exit(0);
