import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { participants } from "@/db/schema";
import { requerirAdmin } from "@/lib/contexto";
import { enviarAvisoSorteoConBoton } from "@/lib/whatsapp";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;
  const [participante] = await db.select().from(participants).where(eq(participants.id, id));
  if (!participante) return NextResponse.json({ error: "No existe ese participante." }, { status: 404 });
  if (!participante.phone) {
    return NextResponse.json({ error: "Ese participante no tiene teléfono guardado." }, { status: 400 });
  }

  try {
    // El botón de la plantilla ya lleva la URL base puesta en Meta; solo
    // hace falta mandar el trocito que falta detrás (el token).
    await enviarAvisoSorteoConBoton(participante.phone, participante.accessToken);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido." }, { status: 502 });
  }
}
