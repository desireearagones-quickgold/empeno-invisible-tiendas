import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db/client";
import { giftPhotos, gifts, participants } from "@/db/schema";
import { requerirSesion } from "@/lib/contexto";
import { resenasAbiertas } from "@/lib/calendario";

const FORMATOS = new Set(["image/jpeg", "image/png", "image/webp"]);
// El móvil ya la manda reducida (~200 KB); esto solo frena lo que no venga de la app.
const MAX_BYTES = 3 * 1024 * 1024;

export async function GET() {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  const lista = await db
    .select({
      id: gifts.id,
      title: gifts.title,
      photoUrl: gifts.photoUrl,
      receiverId: gifts.receiverId,
      receiverName: participants.name,
    })
    .from(gifts)
    .leftJoin(participants, eq(gifts.receiverId, participants.id));

  return NextResponse.json({ gifts: lista });
}

export async function POST(req: NextRequest) {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  if (!resenasAbiertas()) {
    return NextResponse.json({ error: "Todavía no se ha abierto la entrega de regalos." }, { status: 403 });
  }

  const form = await req.formData();
  const title = String(form.get("title") ?? "").slice(0, 120);
  const file = form.get("photo");

  if (!title) {
    return NextResponse.json({ error: "Falta el título." }, { status: 400 });
  }

  const hayFoto = file instanceof File && file.size > 0;
  if (hayFoto && !FORMATOS.has(file.type)) {
    return NextResponse.json({ error: "Formato de imagen no soportado." }, { status: 400 });
  }
  if (hayFoto && file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La foto es demasiado grande." }, { status: 400 });
  }

  const [existente] = await db.select().from(gifts).where(eq(gifts.receiverId, ctx.participante.id));
  const giftId = existente?.id ?? crypto.randomUUID();
  const ahora = new Date().toISOString();
  // El ?v= cambia con cada foto nueva, así el navegador no enseña la vieja de caché.
  const photoUrl = hayFoto ? `/api/gifts/${giftId}/foto?v=${Date.now()}` : null;

  if (existente) {
    await db
      .update(gifts)
      .set({ title, ...(photoUrl ? { photoUrl } : {}) })
      .where(eq(gifts.id, giftId));
  } else {
    await db.insert(gifts).values({ id: giftId, receiverId: ctx.participante.id, title, photoUrl, createdAt: ahora });
  }

  if (hayFoto) {
    const fila = {
      mime: file.type,
      dataBase64: Buffer.from(await file.arrayBuffer()).toString("base64"),
      updatedAt: ahora,
    };
    await db
      .insert(giftPhotos)
      .values({ giftId, ...fila })
      .onConflictDoUpdate({ target: giftPhotos.giftId, set: fila });
  }

  return NextResponse.json({ ok: true });
}
