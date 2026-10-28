import { config } from "dotenv";
config({ path: ".env.local" });

import { enviarAvisoSorteo } from "../src/lib/whatsapp";

const numero = process.argv[2];
const enlace = process.argv[3] ?? "https://ejemplo.com/acceso/abc123";
if (!numero) {
  throw new Error('Uso: tsx scripts/test-whatsapp.mts 34617218632 [enlace] (sin "+" ni espacios)');
}

const resultado = await enviarAvisoSorteo(numero, enlace);
console.log("Enviado:", JSON.stringify(resultado, null, 2));
