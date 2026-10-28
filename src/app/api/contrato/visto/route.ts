import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assignments } from "@/db/schema";
import { requerirSesion } from "@/lib/contexto";
import { hashId } from "@/lib/crypto";

export async function POST() {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  await db
    .update(assignments)
    .set({ contractOpenedAt: new Date().toISOString() })
    .where(eq(assignments.giverHash, hashId(ctx.participante.id)));

  return NextResponse.json({ ok: true });
}
