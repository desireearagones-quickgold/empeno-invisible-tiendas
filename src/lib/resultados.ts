import { eq, and } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db/client";
import { reviewRatings, reviewComments, participants } from "@/db/schema";

export type ComentarioReseña = { id: string; authorName: string; comment: string; createdAt: string };
export type DetalleReseña = { mediaValoracion: number; numValoraciones: number; miValoracion: number | null; comentarios: ComentarioReseña[] };

export async function detalleReseña(reviewId: string, miId: string): Promise<DetalleReseña> {
  const valoraciones = await db.select().from(reviewRatings).where(eq(reviewRatings.reviewId, reviewId));
  const total = valoraciones.reduce((acc, v) => acc + v.quilates, 0);
  const mediaValoracion = valoraciones.length ? total / valoraciones.length : 0;
  const mia = valoraciones.find((v) => v.raterId === miId);

  const comentariosFilas = await db
    .select({ id: reviewComments.id, comment: reviewComments.comment, createdAt: reviewComments.createdAt, authorName: participants.name })
    .from(reviewComments)
    .leftJoin(participants, eq(reviewComments.authorId, participants.id))
    .where(eq(reviewComments.reviewId, reviewId));

  return {
    mediaValoracion,
    numValoraciones: valoraciones.length,
    miValoracion: mia?.quilates ?? null,
    comentarios: comentariosFilas.map((c) => ({ ...c, authorName: c.authorName ?? "—" })),
  };
}

export async function valorarReseña(reviewId: string, raterId: string, quilates: number) {
  const [existente] = await db
    .select()
    .from(reviewRatings)
    .where(and(eq(reviewRatings.reviewId, reviewId), eq(reviewRatings.raterId, raterId)));

  if (existente) {
    await db.update(reviewRatings).set({ quilates }).where(eq(reviewRatings.id, existente.id));
  } else {
    await db.insert(reviewRatings).values({
      id: crypto.randomUUID(),
      reviewId,
      raterId,
      quilates,
      createdAt: new Date().toISOString(),
    });
  }
}

export async function comentarReseña(reviewId: string, authorId: string, comment: string) {
  await db.insert(reviewComments).values({
    id: crypto.randomUUID(),
    reviewId,
    authorId,
    comment: comment.slice(0, 280),
    createdAt: new Date().toISOString(),
  });
}
