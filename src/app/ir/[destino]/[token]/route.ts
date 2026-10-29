import { NextRequest, NextResponse } from "next/server";
import { entrarYRedirigir } from "@/lib/acceso";
import { DESTINOS, type Destino } from "@/lib/avisos";

// Botón de los avisos por WhatsApp: entra con el enlace personal y lleva
// directo a la página del aviso (la pista nueva, escribir la pista...).
export async function GET(req: NextRequest, { params }: { params: Promise<{ destino: string; token: string }> }) {
  const { destino, token } = await params;
  if (!DESTINOS.includes(destino as Destino)) {
    return NextResponse.json({ error: "Destino desconocido." }, { status: 404 });
  }
  return entrarYRedirigir(req, token, `/${destino}`);
}
