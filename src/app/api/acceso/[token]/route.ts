import { NextRequest, NextResponse } from "next/server";
import { accederConToken } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // nextUrl.origin no vale aquí: con el servidor escuchando en 0.0.0.0 (para
  // poder probar desde el móvil), devuelve "0.0.0.0" en vez del host real
  // por el que ha entrado el navegador. El header Host sí trae el bueno.
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const protocolo = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const base = `${protocolo}://${host}`;

  if (!(await accederConToken(token))) {
    return NextResponse.redirect(`${base}/?error=enlace-invalido`);
  }

  return NextResponse.redirect(`${base}/contrato`);
}
