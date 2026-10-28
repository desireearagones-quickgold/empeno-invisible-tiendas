import { NextRequest, NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/contexto";
import { activarModoDemo, modoDemoActivo } from "@/lib/demo";

export async function GET() {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;
  return NextResponse.json({ activo: modoDemoActivo() });
}

export async function POST(req: NextRequest) {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;
  const { activar } = await req.json().catch(() => ({ activar: false }));
  activarModoDemo(Boolean(activar));
  return NextResponse.json({ ok: true });
}
