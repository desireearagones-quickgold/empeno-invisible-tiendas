import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db/client";
import { fichas } from "@/db/schema";
import { requerirSesion } from "@/lib/contexto";
import { hashId } from "@/lib/crypto";
import { aperturaPista, pistaAbierta } from "@/lib/calendario";
import { CAMPOS_FICHA, MAX_CARACTERES_CAMPO } from "@/lib/validacionFicha";

export async function GET() {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  const mias = await db.select().from(fichas).where(eq(fichas.authorHash, hashId(ctx.participante.id)));
  return NextResponse.json({ fichas: mias });
}

export async function POST(req: NextRequest) {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  const body = await req.json().catch(() => null);
  const numero = Number(body?.number);
  const fields = body?.fields;

  if (![1, 2, 3].includes(numero) || typeof fields !== "object" || fields === null) {
    return NextResponse.json({ error: "Datos de pista no válidos." }, { status: 400 });
  }

  const camposValidos = CAMPOS_FICHA[numero as 1 | 2 | 3].map((c) => c.clave);
  const limpio: Record<string, string> = {};
  for (const clave of camposValidos) {
    limpio[clave] = String(fields[clave] ?? "").slice(0, MAX_CARACTERES_CAMPO);
  }
  if (Object.values(limpio).every((v) => !v.trim())) {
    return NextResponse.json({ error: "La pista está vacía." }, { status: 400 });
  }

  const authorHash = hashId(ctx.participante.id);
  const [existente] = await db
    .select()
    .from(fichas)
    .where(and(eq(fichas.authorHash, authorHash), eq(fichas.number, numero)));

  const ahora = new Date();
  // Hasta que le llega a la otra persona se puede corregir; después no, para
  // que lo que ya ha leído no cambie. La hora de llegada no se mueve al
  // corregir: se fijó al guardarla la primera vez.
  if (existente && pistaAbierta(existente.abreEn, ahora)) {
    return NextResponse.json({ error: "Esta pista ya le ha llegado: no se puede cambiar." }, { status: 403 });
  }

  const abreEn = existente?.abreEn ?? aperturaPista(ahora).toISOString();
  if (existente) {
    await db.update(fichas).set({ fields: limpio, updatedAt: ahora.toISOString() }).where(eq(fichas.id, existente.id));
  } else {
    await db.insert(fichas).values({
      id: crypto.randomUUID(),
      authorHash,
      number: numero,
      fields: limpio,
      updatedAt: ahora.toISOString(),
      abreEn,
    });
  }

  return NextResponse.json({ ok: true, abreEn, mensaje: "Pista guardada. Le llegará mañana a las 9:00." });
}
