import { config as cargarEnv } from "dotenv";
cargarEnv({ path: ".env.local" });

// Import dinámico a propósito: los `import` estáticos se izan antes de que
// se ejecute cargarEnv(), y db/client.ts necesita DATABASE_URL ya puesta.
const { db } = await import("../src/db/client");
const { participants, config } = await import("../src/db/schema");
const { randomToken } = await import("../src/lib/crypto");
const crypto = await import("node:crypto");

const NOMBRES = [
  "Ana", "Juan", "Marta", "Luis", "Elena", "Carlos", "Lucía", "Pablo", "Sara", "Diego",
  "Laura", "Javier", "Irene", "Alberto", "Marina", "Daniel", "Cristina", "Sergio", "Nuria", "Raúl",
  "Paula", "Óscar", "Beatriz", "Rubén", "Silvia", "Hugo", "Alicia", "Iván", "Noelia", "Víctor",
];

for (const nombre of NOMBRES) {
  const id = crypto.randomUUID();
  const email = `${nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@quickgold.es`;
  await db
    .insert(participants)
    .values({ id, name: nombre, email, accessToken: randomToken(), createdAt: new Date().toISOString() })
    .onConflictDoNothing();
}

// La dueña del proyecto también juega (ver ADMIN_EMAILS en .env): si no está
// en participants no puede ni entrar a /admin.
await db
  .insert(participants)
  .values({
    id: crypto.randomUUID(),
    name: "Desireé",
    email: "desiree.aragones@quickgold.es",
    phone: "34684114286",
    accessToken: randomToken(),
    createdAt: new Date().toISOString(),
  })
  .onConflictDoNothing();

await db
  .insert(config)
  .values({ key: "sorteo_hecho", value: "false" })
  .onConflictDoNothing();

console.log(`Sembrados ${NOMBRES.length} participantes de prueba (@quickgold.es).`);
process.exit(0);
