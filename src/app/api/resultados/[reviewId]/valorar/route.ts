import { NextRequest, NextResponse } from "next/server";
import { requerirSesion } from "@/lib/contexto";
import { resultadosAbiertos } from "@/lib/calendario";
import { valorarReseña } from "@/lib/resultados";

export async function POST(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  if (!resultadosAbiertos()) {
    return NextResponse.json({ error: "Todavía no se han abierto los resultados." }, { status: 403 });
  }

  const { reviewId } = await params;
  const { quilates } = await req.json().catch(() => ({}));
  if (!Number.isInteger(quilates) || quilates < 1 || quilates > 5) {
    return NextResponse.json({ error: "Valoración no válida." }, { status: 400 });
  }

  await valorarReseña(reviewId, ctx.participante.id, quilates);
  return NextResponse.json({ ok: true });
}
