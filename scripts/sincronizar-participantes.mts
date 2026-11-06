// Deja los participantes igual que un listado (nombre<TAB>teléfono). Se empareja
// por teléfono: si coincide se conserva la persona (y su enlace) y solo se corrige
// el nombre; si no está en el listado se da de baja; si es nueva se da de alta.
// Uso: npx tsx scripts/sincronizar-participantes.mts <listado.tsv>            (solo enseña)
//      npx tsx scripts/sincronizar-participantes.mts <listado.tsv> --aplicar  (cambia)
import { config } from "dotenv";
config({ path: ".env.local" });
import fs from "node:fs";
import crypto from "node:crypto";
const { db } = await import("../src/db/client");
const { participants, assignments } = await import("../src/db/schema");
const { eq } = await import("drizzle-orm");
const { randomToken } = await import("../src/lib/crypto");

const [ruta] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const aplicar = process.argv.includes("--aplicar");
const telefono = (v: string) => {
  const d = v.replace(/[^0-9]/g, "");
  return d.length === 9 ? "34" + d : d;
};
const listado = fs.readFileSync(ruta, "utf8").split(/\r?\n/).filter((l) => l.trim())
  .map((l) => { const [n, t] = l.split("\t"); return { name: n.trim(), phone: telefono(t) }; });
const repes = listado.map((p) => p.phone).filter((t, i, a) => a.indexOf(t) !== i);
if (repes.length) throw new Error("Teléfonos repetidos en el listado: " + repes.join(", "));

if ((await db.select().from(assignments)).length) throw new Error("Ya hay sorteo hecho: no se toca el listado.");

const actuales = await db.select().from(participants);
const porTel = new Map(actuales.map((p) => [p.phone, p]));
const enListado = new Set(listado.map((p) => p.phone));

for (const p of listado) {
  const a = porTel.get(p.phone);
  if (!a) {
    console.log("ALTA  ", p.name, p.phone);
    if (aplicar) await db.insert(participants).values({ id: crypto.randomUUID(), name: p.name, email: null, phone: p.phone, accessToken: randomToken(), createdAt: new Date().toISOString() });
  } else if (a.name !== p.name) {
    console.log("NOMBRE", a.name, "→", p.name, p.phone);
    if (aplicar) await db.update(participants).set({ name: p.name }).where(eq(participants.id, a.id));
  }
}
for (const a of actuales) {
  if (!enListado.has(a.phone ?? "")) {
    console.log("BAJA  ", a.name, a.phone);
    if (aplicar) await db.delete(participants).where(eq(participants.id, a.id));
  }
}
console.log(`${actuales.length} → ${listado.length} personas${aplicar ? "" : " (no se ha cambiado nada: falta --aplicar)"}`);
process.exit(0);
