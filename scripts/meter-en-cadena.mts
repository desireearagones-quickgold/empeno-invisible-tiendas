// Mete a una persona nueva en la cadena después del sorteo sin que nadie note
// nada: se elige AL AZAR una pareja X→Y cuyo X aún no ha abierto su contrato y
// queda X→nueva, nueva→Y. Y conserva su número de lote (su ticket no cambia);
// X recibe un número nuevo (no lo había visto). No imprime nombres de parejas.
// Uso: npx tsx scripts/meter-en-cadena.mts "Nombre" 600112233            (solo mira)
//      npx tsx scripts/meter-en-cadena.mts "Nombre" 600112233 --aplicar  (cambia)
import { config as dotenv } from "dotenv";
dotenv({ path: ".env.local" });
import crypto from "node:crypto";
const { db } = await import("../src/db/client");
const { participants, assignments } = await import("../src/db/schema");
const { eq, isNull } = await import("drizzle-orm");
const { encryptId, hashId, randomToken, randomContractNumber } = await import("../src/lib/crypto");

const [nombre, tel] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const aplicar = process.argv.includes("--aplicar");
const digitos = (tel ?? "").replace(/[^0-9]/g, "");
const phone = digitos.length === 9 ? "34" + digitos : digitos;
if (!nombre || !/^34[67][0-9]{8}$/.test(phone)) throw new Error("Hace falta nombre y un móvil español.");

const [yaEsta] = await db.select().from(participants).where(eq(participants.phone, phone));
if (yaEsta) throw new Error(`Ese teléfono ya es de ${yaEsta.name}.`);
const todas = await db.select().from(assignments);
if (!todas.length) throw new Error("No hay sorteo: basta con darla de alta normal.");
const sinAbrir = await db.select().from(assignments).where(isNull(assignments.contractOpenedAt));
console.log(`parejas: ${todas.length}, contratos sin abrir: ${sinAbrir.length}`);
if (!sinAbrir.length) throw new Error("Todos han abierto ya su contrato: alguien tendrá que enterarse del cambio.");
if (!aplicar) { console.log("(no se ha cambiado nada: falta --aplicar)"); process.exit(0); }

const elegida = sinAbrir[crypto.randomInt(sinAbrir.length)];
const usados = new Set(todas.map((a) => a.contractNumber));
let numeroNuevo = randomContractNumber();
while (usados.has(numeroNuevo)) numeroNuevo = randomContractNumber();
const id = crypto.randomUUID();

await db.transaction(async (tx) => {
  await tx.insert(participants).values({ id, name: nombre, email: null, phone, accessToken: randomToken(), createdAt: new Date().toISOString() });
  // nueva → Y, con el número de siempre de Y. Va después de soltar Y de la fila
  // elegida, porque receiver_hash es UNIQUE.
  await tx.update(assignments)
    .set({ receiverHash: hashId(id), receiverEnc: encryptId(id), contractNumber: numeroNuevo })
    .where(eq(assignments.id, elegida.id));
  await tx.insert(assignments).values({
    id: crypto.randomUUID(),
    giverHash: hashId(id), giverEnc: encryptId(id),
    receiverHash: elegida.receiverHash, receiverEnc: elegida.receiverEnc,
    contractNumber: elegida.contractNumber,
  });
});

// Comprobación: sigue siendo un solo círculo que pasa por todos.
const filas = await db.select().from(assignments);
const gente = await db.select().from(participants);
const sig = new Map(filas.map((a) => [a.giverHash, a.receiverHash]));
let actual = hashId(id), pasos = 0;
do { actual = sig.get(actual)!; pasos++; } while (actual && actual !== hashId(id) && pasos <= filas.length);
console.log(`hecho. personas: ${gente.length}, parejas: ${filas.length}, círculo de ${pasos} (debe ser ${gente.length})`,
  `| números únicos: ${new Set(filas.map((a) => a.contractNumber)).size}`);
process.exit(0);
