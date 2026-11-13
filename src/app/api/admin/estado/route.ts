import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { participants, assignments, fichas, config } from "@/db/schema";
import { requerirAdmin } from "@/lib/contexto";
import { esAdmin } from "@/lib/auth";

export async function GET() {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  const totalParticipantes = (await db.select().from(participants)).filter((p) => !esAdmin(p.phone)).length;
  const [sorteoHechoFila] = await db.select().from(config).where(eq(config.key, "sorteo_hecho"));
  const sorteoHecho = sorteoHechoFila?.value === "true";
  const todasLasFichas = await db.select().from(fichas);
  const fichasPorNumero = ([1, 2, 3] as const).map(
    (n) => todasLasFichas.filter((f) => f.number === n).length
  );
  const totalAsignaciones = (await db.select().from(assignments)).length;

  return NextResponse.json({
    totalParticipantes,
    sorteoHecho,
    totalAsignaciones,
    fichasPorNumero,
  });
}
