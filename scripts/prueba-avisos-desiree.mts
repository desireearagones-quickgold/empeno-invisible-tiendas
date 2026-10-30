import { config } from "dotenv";
config({ path: ".env.local" });
process.env.APP_URL = "https://amigoinvisible.quickgold.es";
const { enviarWhatsApp, enviarAvisoSorteoConBoton } = await import("../src/lib/whatsapp");
const { PLANTILLAS } = await import("../src/lib/avisos");
const { db } = await import("../src/db/client");
const { participants } = await import("../src/db/schema");
const { eq } = await import("drizzle-orm");

// SOLO a Desirée. Nunca cambiar este número por el de un compañero.
const YO = "34684114286";
const [yo] = await db.select().from(participants).where(eq(participants.phone, YO));
if (!yo) throw new Error("No encuentro a Desirée");
const t = yo.accessToken;
const env = (p: { nombre: string; idioma: string }, destino: string) =>
  enviarWhatsApp(YO, { template: p.nombre, lang: p.idioma, botonSufijo: `${destino}/${t}` });
const pasos: [string, () => Promise<unknown>][] = [
  ["1 sorteo", () => enviarAvisoSorteoConBoton(YO, t)],
  ["2 recordatorio", () => env(PLANTILLAS.recordatorio, "mis-fichas")],
  ["3 pista nueva", () => env(PLANTILLAS.pista, "caja")],
  ["4 regalos", () => env(PLANTILLAS.regalos, "resenas")],
];
for (const [nombre, f] of pasos) {
  try { const r: any = await f(); console.log(nombre, "OK", r.messages?.[0]?.message_status ?? ""); }
  catch (e) { console.log(nombre, "FALLO", String(e).slice(0, 300)); }
  await new Promise((r) => setTimeout(r, 5000));
}
process.exit(0);
