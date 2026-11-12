import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assignments, fichas, fichaOpens } from "@/db/schema";
import { requerirSesion } from "@/lib/contexto";
import { hashId } from "@/lib/crypto";
import { pistaAbierta } from "@/lib/calendario";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ numero: string }> }) {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  const numero = Number((await params).numero);
  if (![1, 2, 3].includes(numero)) {
    return NextResponse.json({ error: "Pista no válida." }, { status: 400 });
  }

  const receiverHash = hashId(ctx.participante.id);
  const [miAsignacion] = await db.select().from(assignments).where(eq(assignments.receiverHash, receiverHash));
  if (!miAsignacion) {
    return NextResponse.json({ error: "No hay sorteo asignado todavía." }, { status: 404 });
  }

  const [ficha] = await db
    .select()
    .from(fichas)
    .where(and(eq(fichas.authorHash, miAsignacion.giverHash), eq(fichas.number, numero)));

  // Sin pista o sin llegar todavía, la misma respuesta: no se dice si está
  // escrita, que eso ya da una idea de cuándo la escribió.
  if (!ficha || !pistaAbierta(ficha.abreEn)) {
    return NextResponse.json({ error: "Esta pista todavía no ha llegado." }, { status: 403 });
  }

  await db
    .insert(fichaOpens)
    .values({ receiverHash, number: numero, openedAt: new Date().toISOString() })
    .onConflictDoNothing();

  return NextResponse.json({ hayFicha: true, campos: ficha.fields, numero });
}
