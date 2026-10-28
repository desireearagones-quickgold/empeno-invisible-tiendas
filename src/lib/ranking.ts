import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { gifts, reviews, participants } from "@/db/schema";

export type PuestoRanking = {
  giftId: string;
  title: string;
  photoUrl: string | null;
  receiverName: string | null;
  totalQuilates: number;
  media: number;
  numReseñas: number;
  mejoresReseñas: string[];
};

export async function calcularRanking(): Promise<PuestoRanking[]> {
  const todosLosRegalos = await db
    .select({
      id: gifts.id,
      title: gifts.title,
      photoUrl: gifts.photoUrl,
      receiverId: gifts.receiverId,
      receiverName: participants.name,
    })
    .from(gifts)
    .leftJoin(participants, eq(gifts.receiverId, participants.id));

  const puestos = await Promise.all(
    todosLosRegalos.map(async (regalo) => {
      const reseñasRegaloTodas = await db.select().from(reviews).where(eq(reviews.giftId, regalo.id));
      const reseñasRegalo = reseñasRegaloTodas.filter((r) => !r.hidden);

      const totalQuilates = reseñasRegalo.reduce((acc, r) => acc + r.quilates, 0);
      const media = reseñasRegalo.length ? totalQuilates / reseñasRegalo.length : 0;
      const mejoresReseñas = reseñasRegalo
        .filter((r) => r.comment)
        .sort((a, b) => b.quilates - a.quilates)
        .slice(0, 3)
        .map((r) => r.comment as string);

      return {
        giftId: regalo.id,
        title: regalo.title,
        photoUrl: regalo.photoUrl,
        receiverName: regalo.receiverName,
        totalQuilates,
        media,
        numReseñas: reseñasRegalo.length,
        mejoresReseñas,
      };
    })
  );

  return puestos.sort(
    (a, b) => b.totalQuilates - a.totalQuilates || b.media - a.media || b.numReseñas - a.numReseñas
  );
}

export type ReseñaPublica = {
  id: string;
  quilates: number;
  comment: string | null;
  createdAt: string;
};

/** Las reseñas de un regalo, sin tocar quién las escribió (sigue anónimo). */
export async function reseñasDeRegalo(giftId: string): Promise<ReseñaPublica[]> {
  const filas = await db
    .select({
      id: reviews.id,
      quilates: reviews.quilates,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      hidden: reviews.hidden,
    })
    .from(reviews)
    .where(eq(reviews.giftId, giftId));
  return filas.filter((r) => !r.hidden).map(({ id, quilates, comment, createdAt }) => ({ id, quilates, comment, createdAt }));
}
