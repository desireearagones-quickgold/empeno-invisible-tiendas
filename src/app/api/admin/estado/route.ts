import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { participants, assignments, fichas, gifts, reviews, config } from "@/db/schema";
import { requerirAdmin } from "@/lib/contexto";

export async function GET() {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  const totalParticipantes = db.select().from(participants).all().length;
  const sorteoHecho = db.select().from(config).where(eq(config.key, "sorteo_hecho")).get()?.value === "true";
  const todasLasFichas = db.select().from(fichas).all();
  const fichasPorNumero = ([1, 2, 3] as const).map(
    (n) => todasLasFichas.filter((f) => f.number === n).length
  );
  const regalosConFoto = db.select().from(gifts).all().filter((g) => g.photoUrl).length;
  const reseñasTotales = db.select().from(reviews).all().length;
  const totalAsignaciones = db.select().from(assignments).all().length;

  return NextResponse.json({
    totalParticipantes,
    sorteoHecho,
    totalAsignaciones,
    fichasPorNumero,
    regalosConFoto,
    reseñasTotales,
  });
}
