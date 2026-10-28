import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { reviews } from "@/db/schema";
import { requerirAdmin } from "@/lib/contexto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;
  const { hidden } = await req.json().catch(() => ({ hidden: true }));

  await db.update(reviews).set({ hidden: Boolean(hidden) }).where(eq(reviews.id, id));
  return NextResponse.json({ ok: true });
}
