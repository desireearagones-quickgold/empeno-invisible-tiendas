import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db/client";
import { fichas } from "@/db/schema";
import { requerirSesion } from "@/lib/contexto";
import { hashId } from "@/lib/crypto";
import { fichaCerrada } from "@/lib/calendario";
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
    return NextResponse.json({ error: "Datos de ficha no válidos." }, { status: 400 });
  }

  if (fichaCerrada(numero as 1 | 2 | 3)) {
    return NextResponse.json({ error: "El plazo para esta ficha ya ha pasado." }, { status: 403 });
  }

  const camposValidos = CAMPOS_FICHA[numero as 1 | 2 | 3].map((c) => c.clave);
  const limpio: Record<string, string> = {};
  for (const clave of camposValidos) {
    const valor = String(fields[clave] ?? "").slice(0, MAX_CARACTERES_CAMPO);
    limpio[clave] = valor;
  }

  const authorHash = hashId(ctx.participante.id);
  const [existente] = await db
    .select()
    .from(fichas)
    .where(and(eq(fichas.authorHash, authorHash), eq(fichas.number, numero)));

  if (existente) {
    await db
      .update(fichas)
      .set({ fields: limpio, updatedAt: new Date().toISOString() })
      .where(eq(fichas.id, existente.id));
  } else {
    await db.insert(fichas).values({
      id: crypto.randomUUID(),
      authorHash,
      number: numero,
      fields: limpio,
      updatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, mensaje: "Tasación archivada. Nadie sospecha nada." });
}
