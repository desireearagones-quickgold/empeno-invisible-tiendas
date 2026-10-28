import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assignments, fichas, fichaOpens } from "@/db/schema";
import { requerirSesion } from "@/lib/contexto";
import { hashId } from "@/lib/crypto";
import { fichaDesbloqueada } from "@/lib/calendario";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ numero: string }> }) {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  const numero = Number((await params).numero);
  if (![1, 2, 3].includes(numero)) {
    return NextResponse.json({ error: "Compartimento no válido." }, { status: 400 });
  }
  if (!fichaDesbloqueada(numero as 1 | 2 | 3)) {
    return NextResponse.json({ error: "Todavía está cerrado con candado." }, { status: 403 });
  }

  const receiverHash = hashId(ctx.participante.id);
  const miAsignacion = db.select().from(assignments).where(eq(assignments.receiverHash, receiverHash)).get();
  if (!miAsignacion) {
    return NextResponse.json({ error: "No hay sorteo asignado todavía." }, { status: 404 });
  }

  const ficha = db
    .select()
    .from(fichas)
    .where(and(eq(fichas.authorHash, miAsignacion.giverHash), eq(fichas.number, numero)))
    .get();

  db.insert(fichaOpens)
    .values({ receiverHash, number: numero, openedAt: new Date().toISOString() })
    .onConflictDoNothing()
    .run();

  if (!ficha) {
    return NextResponse.json({ hayFicha: false, mensaje: "El tasador está de vacaciones. Esta semana no hay pista." });
  }

  return NextResponse.json({ hayFicha: true, campos: ficha.fields, numero });
}
