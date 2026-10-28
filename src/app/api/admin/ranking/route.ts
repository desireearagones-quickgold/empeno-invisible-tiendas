import { NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/contexto";
import { calcularRanking } from "@/lib/ranking";

export async function GET() {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  return NextResponse.json({ ranking: await calcularRanking() });
}
