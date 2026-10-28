import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db/client";
import { gifts, reviews, assignments } from "@/db/schema";
import { requerirSesion } from "@/lib/contexto";
import { hashId } from "@/lib/crypto";
import { resenasAbiertas } from "@/lib/calendario";

export async function GET(req: NextRequest) {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  const giftId = req.nextUrl.searchParams.get("giftId");
  if (!giftId) return NextResponse.json({ error: "Falta giftId." }, { status: 400 });

  const [propia] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.giftId, giftId), eq(reviews.reviewerHash, hashId(ctx.participante.id))));

  const publicas = await db.select().from(reviews).where(and(eq(reviews.giftId, giftId), eq(reviews.hidden, false)));

  return NextResponse.json({ miReseña: propia ?? null, reseñas: publicas });
}

export async function POST(req: NextRequest) {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  if (!resenasAbiertas()) {
    return NextResponse.json({ error: "Las reseñas están cerradas." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const giftId = body?.giftId as string | undefined;
  const quilates = Number(body?.quilates);
  const comment = typeof body?.comment === "string" ? body.comment.slice(0, 280) : null;

  if (!giftId || !Number.isInteger(quilates) || quilates < 1 || quilates > 5) {
    return NextResponse.json({ error: "Reseña no válida." }, { status: 400 });
  }

  const [gift] = await db.select().from(gifts).where(eq(gifts.id, giftId));
  if (!gift) return NextResponse.json({ error: "Ese regalo no existe." }, { status: 404 });

  const reviewerHash = hashId(ctx.participante.id);

  const [asignacionDelRegalo] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.receiverHash, hashId(gift.receiverId)));

  if (asignacionDelRegalo?.giverHash === reviewerHash) {
    return NextResponse.json({ error: "No puedes tasar tu propia pieza." }, { status: 403 });
  }

  const [existente] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.giftId, giftId), eq(reviews.reviewerHash, reviewerHash)));

  if (existente) {
    await db.update(reviews).set({ quilates, comment }).where(eq(reviews.id, existente.id));
  } else {
    await db.insert(reviews).values({
      id: crypto.randomUUID(),
      giftId,
      reviewerHash,
      quilates,
      comment,
      createdAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, mensaje: "Tasación registrada. Tu secreto está a salvo en la cámara acorazada." });
}
