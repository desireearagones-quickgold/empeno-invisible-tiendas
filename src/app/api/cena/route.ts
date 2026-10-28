import { NextRequest, NextResponse } from "next/server";
import { requerirSesion } from "@/lib/contexto";
import { cenaAbierta } from "@/lib/calendario";
import { calcularRanking } from "@/lib/ranking";
import { modoDemoActivo, RANKING_DEMO } from "@/lib/demo";

export async function POST(req: NextRequest) {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  const { pin } = await req.json().catch(() => ({}));
  const demo = await modoDemoActivo();

  if (!demo && !cenaAbierta()) {
    return NextResponse.json({ error: "Todavía no es la hora de los resultados." }, { status: 403 });
  }

  if (String(pin) !== String(process.env.DINNER_PIN ?? "")) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 403 });
  }

  return NextResponse.json({ ranking: demo ? RANKING_DEMO : await calcularRanking() });
}
