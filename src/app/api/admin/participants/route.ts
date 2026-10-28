import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db/client";
import { participants, assignments, config } from "@/db/schema";
import { requerirAdmin } from "@/lib/contexto";
import { hashId, randomToken } from "@/lib/crypto";

function limpiarTelefono(valor: string | undefined): string | null {
  if (!valor) return null;
  const limpio = valor.replace(/[^0-9]/g, "");
  return limpio || null;
}

export async function GET() {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  return NextResponse.json({ participants: await db.select().from(participants) });
}

export async function POST(req: NextRequest) {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const archivo = form.get("csv");
    if (!(archivo instanceof File)) {
      return NextResponse.json({ error: "Falta el fichero CSV." }, { status: 400 });
    }
    const texto = await archivo.text();
    const filas = texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    let añadidos = 0;
    for (const fila of filas) {
      const [name, email, phone] = fila.split(",").map((c) => c.trim());
      if (!name || !email || name.toLowerCase() === "name") continue;
      await db
        .insert(participants)
        .values({
          id: crypto.randomUUID(),
          name,
          email: email.toLowerCase(),
          phone: limpiarTelefono(phone),
          accessToken: randomToken(),
          createdAt: new Date().toISOString(),
        })
        .onConflictDoNothing();
      añadidos++;
    }
    return NextResponse.json({ ok: true, añadidos });
  }

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.email) {
    return NextResponse.json({ error: "Faltan nombre o email." }, { status: 400 });
  }
  await db.insert(participants).values({
    id: crypto.randomUUID(),
    name: body.name,
    email: String(body.email).toLowerCase(),
    phone: limpiarTelefono(body.phone),
    accessToken: randomToken(),
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400 });

  const [sorteoHechoFila] = await db.select().from(config).where(eq(config.key, "sorteo_hecho"));
  if (sorteoHechoFila?.value === "true") {
    const hash = hashId(id);
    const [enCadena] = await db.select().from(assignments).where(eq(assignments.giverHash, hash));
    if (enCadena) {
      return NextResponse.json(
        { error: "Ya tiene pareja asignada. Usa \"Reparar cadena\" antes de borrarlo." },
        { status: 409 }
      );
    }
  }

  await db.delete(participants).where(eq(participants.id, id));
  return NextResponse.json({ ok: true });
}
