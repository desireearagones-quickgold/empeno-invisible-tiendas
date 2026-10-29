import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/contexto";
import { proximoPaso } from "@/lib/proximoPaso";

export async function GET() {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;
  return NextResponse.json({ paso: await proximoPaso(ctx.participante.id) });
}
