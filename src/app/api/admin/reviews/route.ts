import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { reviews, gifts } from "@/db/schema";
import { requerirAdmin } from "@/lib/contexto";

export async function GET() {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  const lista = db
    .select({
      id: reviews.id,
      comment: reviews.comment,
      quilates: reviews.quilates,
      hidden: reviews.hidden,
      giftTitle: gifts.title,
    })
    .from(reviews)
    .leftJoin(gifts, eq(reviews.giftId, gifts.id))
    .all();

  // Nunca se expone reviewerHash ni nada que identifique al autor.
  return NextResponse.json({ reviews: lista });
}
