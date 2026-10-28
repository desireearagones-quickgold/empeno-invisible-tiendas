import "dotenv/config";
import crypto from "node:crypto";
import { db } from "../src/db/client";
import { participants, config } from "../src/db/schema";
import { randomToken } from "../src/lib/crypto";

const NOMBRES = [
  "Ana", "Juan", "Marta", "Luis", "Elena", "Carlos", "Lucía", "Pablo", "Sara", "Diego",
  "Laura", "Javier", "Irene", "Alberto", "Marina", "Daniel", "Cristina", "Sergio", "Nuria", "Raúl",
  "Paula", "Óscar", "Beatriz", "Rubén", "Silvia", "Hugo", "Alicia", "Iván", "Noelia", "Víctor",
];

for (const nombre of NOMBRES) {
  const id = crypto.randomUUID();
  const email = `${nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@quickgold.es`;
  db.insert(participants)
    .values({ id, name: nombre, email, accessToken: randomToken(), createdAt: new Date().toISOString() })
    .onConflictDoNothing()
    .run();
}

// La dueña del proyecto también juega (ver ADMIN_EMAILS en .env): si no está
// en participants no puede ni entrar a /admin.
db.insert(participants)
  .values({
    id: crypto.randomUUID(),
    name: "Desireé",
    email: "desiree.aragones@quickgold.es",
    phone: "34684114286",
    accessToken: randomToken(),
    createdAt: new Date().toISOString(),
  })
  .onConflictDoNothing()
  .run();

db.insert(config)
  .values({ key: "sorteo_hecho", value: "false" })
  .onConflictDoNothing()
  .run();

console.log(`Sembrados ${NOMBRES.length} participantes de prueba (@quickgold.es).`);
