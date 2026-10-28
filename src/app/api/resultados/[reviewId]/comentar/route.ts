import { NextRequest, NextResponse } from "next/server";
import { requerirSesion } from "@/lib/contexto";
import { resultadosAbiertos } from "@/lib/calendario";
import { comentarReseña } from "@/lib/resultados";

export async function POST(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  if (!resultadosAbiertos()) {
    return NextResponse.json({ error: "Todavía no se han abierto los resultados." }, { status: 403 });
  }

  const { reviewId } = await params;
  const { comment } = await req.json().catch(() => ({}));
  if (!comment || typeof comment !== "string" || !comment.trim()) {
    return NextResponse.json({ error: "Falta el comentario." }, { status: 400 });
  }

  await comentarReseña(reviewId, ctx.participante.id, comment.trim());
  return NextResponse.json({ ok: true });
}
