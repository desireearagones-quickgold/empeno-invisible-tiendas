import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { participants } from "@/db/schema";
import { requerirAdmin } from "@/lib/contexto";
import { enviarAvisoSorteo } from "@/lib/whatsapp";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;
  const [participante] = await db.select().from(participants).where(eq(participants.id, id));
  if (!participante) return NextResponse.json({ error: "No existe ese participante." }, { status: 404 });
  if (!participante.phone) {
    return NextResponse.json({ error: "Ese participante no tiene teléfono guardado." }, { status: 400 });
  }

  const base = req.headers.get("host") ?? req.nextUrl.host;
  const protocolo = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const enlace = `${protocolo}://${base}/api/acceso/${participante.accessToken}`;

  try {
    await enviarAvisoSorteo(participante.phone, enlace);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido." }, { status: 502 });
  }
}
