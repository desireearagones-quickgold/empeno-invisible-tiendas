import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { participants, assignments, fichas, gifts, reviews, config } from "@/db/schema";
import { requerirAdmin } from "@/lib/contexto";

export async function GET() {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  const totalParticipantes = (await db.select().from(participants)).length;
  const [sorteoHechoFila] = await db.select().from(config).where(eq(config.key, "sorteo_hecho"));
  const sorteoHecho = sorteoHechoFila?.value === "true";
  const todasLasFichas = await db.select().from(fichas);
  const fichasPorNumero = ([1, 2, 3] as const).map(
    (n) => todasLasFichas.filter((f) => f.number === n).length
  );
  const regalosConFoto = (await db.select().from(gifts)).filter((g) => g.photoUrl).length;
  const reseñasTotales = (await db.select().from(reviews)).length;
  const totalAsignaciones = (await db.select().from(assignments)).length;

  return NextResponse.json({
    totalParticipantes,
    sorteoHecho,
    totalAsignaciones,
    fichasPorNumero,
    regalosConFoto,
    reseñasTotales,
  });
}
