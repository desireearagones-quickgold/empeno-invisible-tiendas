// @ts-nocheck -- usa el Playwright de otra carpeta, que no existe en Vercel; sin esto no compila allí.
// Prueba del botón "Mandar WhatsApp a todos" contra el servidor local, que
// tiene puesto WHATSAPP_SOLO_A: solo puede salir el mensaje de Desirée.
// Marca el sorteo como hecho un momento y al final lo deja todo como estaba.
// Uso: npx tsx scripts/prueba-mandar-todos.mts [puerto]
import { config as dotenv } from "dotenv";
dotenv({ path: ".env.local" });
const { db } = await import("../src/db/client");
const { config, participants, sessions, assignments } = await import("../src/db/schema");
const { eq, like, and, gt } = await import("drizzle-orm");
const { chromium } = await import("file:///C:/Users/lappm/Documents/Oficina%20virtual/node_modules/playwright/index.mjs");

if (process.env.WHATSAPP_SOLO_A !== "34684114286") throw new Error("Sin candado no se prueba.");
if ((await db.select().from(assignments)).length) throw new Error("Hay sorteo de verdad: no se prueba.");
const [yaHabia] = await db.select().from(config).where(eq(config.key, "sorteo_hecho"));
if (yaHabia) throw new Error("sorteo_hecho ya existe: no se prueba.");

const puerto = process.argv[2] ?? "3005";
const [yo] = await db.select().from(participants).where(eq(participants.phone, "34684114286"));
const inicio = new Date(Date.now() + 59 * 86_400_000).toISOString();

await db.insert(config).values({ key: "sorteo_hecho", value: "true" });
const b = await chromium.launch({ channel: "chrome" });
try {
  const p = await b.newPage();
  p.on("dialog", (d) => { console.log("confirmación:", d.message()); d.accept(); });
  await p.goto(`http://localhost:${puerto}/ir/caja/${yo.accessToken}`);
  await p.goto(`http://localhost:${puerto}/admin`);
  const boton = p.getByRole("button", { name: "Mandar WhatsApp a todos" });
  await boton.waitFor({ timeout: 60000 });
  console.log("antes:", await p.getByText(/^Lo tienen/).textContent());
  for (const vez of [1, 2]) {
    await boton.click();
    const msg = p.locator("p", { hasText: /^Enviados:/ });
    await msg.waitFor({ timeout: 60000 });
    console.log(`vez ${vez}:`, (await msg.textContent())!.slice(0, 200));
    await p.waitForTimeout(1500);
    console.log("  ", await p.getByText(/^Lo tienen/).textContent(), "| marcados:", await p.getByText("✓ enviado").count());
  }
} finally {
  await b.close();
  await db.delete(config).where(eq(config.key, "sorteo_hecho"));
  await db.delete(config).where(like(config.key, "aviso:sorteo:%"));
  await db.delete(sessions).where(and(eq(sessions.participantId, yo.id), gt(sessions.expiresAt, inicio)));
  const quedan = await db.select().from(config).where(like(config.key, "aviso:%"));
  console.log("limpio. claves aviso que quedan:", quedan.length);
}
process.exit(0);
