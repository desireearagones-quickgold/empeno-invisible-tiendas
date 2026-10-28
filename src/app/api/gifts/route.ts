import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/db/client";
import { gifts, participants } from "@/db/schema";
import { requerirSesion } from "@/lib/contexto";
import { resenasAbiertas } from "@/lib/calendario";

const EXTENSIONES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function GET() {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  const lista = db
    .select({
      id: gifts.id,
      title: gifts.title,
      photoUrl: gifts.photoUrl,
      receiverId: gifts.receiverId,
      receiverName: participants.name,
    })
    .from(gifts)
    .leftJoin(participants, eq(gifts.receiverId, participants.id))
    .all();

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

  let photoUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    const ext = EXTENSIONES[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Formato de imagen no soportado." }, { status: 400 });
    }
    const nombre = `${crypto.randomUUID()}.${ext}`;
    const destino = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(destino, { recursive: true });
    await fs.writeFile(path.join(destino, nombre), Buffer.from(await file.arrayBuffer()));
    photoUrl = `/uploads/${nombre}`;
  }

  const existente = db.select().from(gifts).where(eq(gifts.receiverId, ctx.participante.id)).get();

  if (existente) {
    db.update(gifts)
      .set({ title, ...(photoUrl ? { photoUrl } : {}) })
      .where(eq(gifts.id, existente.id))
      .run();
  } else {
    db.insert(gifts)
      .values({
        id: crypto.randomUUID(),
        receiverId: ctx.participante.id,
        title,
        photoUrl,
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  return NextResponse.json({ ok: true });
}
