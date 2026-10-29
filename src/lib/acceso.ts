import { NextRequest, NextResponse } from "next/server";
import { accederConToken } from "@/lib/auth";

/** Entra con el enlace personal y lleva a `ruta` (o a la portada si el enlace no vale). */
export async function entrarYRedirigir(req: NextRequest, token: string, ruta: string) {
  // nextUrl.origin no vale aquí: con el servidor escuchando en 0.0.0.0 (para
  // poder probar desde el móvil), devuelve "0.0.0.0" en vez del host real
  // por el que ha entrado el navegador. El header Host sí trae el bueno.
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const protocolo = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const base = `${protocolo}://${host}`;

  if (!(await accederConToken(token))) {
    return NextResponse.redirect(`${base}/?error=enlace-invalido`);
  }
  return NextResponse.redirect(`${base}${ruta}`);
}
