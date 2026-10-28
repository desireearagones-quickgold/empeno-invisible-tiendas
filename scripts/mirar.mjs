// Herramienta de uso puntual: entra con un enlace de acceso y saca una foto
// de una página a tamaño de móvil. No forma parte de la app.
import { chromium } from "playwright";

const [, , token, ruta = "/contrato", salida = "foto.png"] = process.argv;
if (!token) {
  throw new Error("Uso: node scripts/mirar.mjs <token-de-acceso> [ruta] [salida.png]");
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 1400 } }); // iPhone 13-ish de ancho
const page = await context.newPage();

await page.goto(`http://localhost:3000/api/acceso/${token}`);
await page.goto(`http://localhost:3000${ruta}`);
await page.waitForTimeout(1500); // deja que acabe la animación del sobre

await page.screenshot({ path: salida, fullPage: true });
console.log("Foto guardada en", salida);

await browser.close();
