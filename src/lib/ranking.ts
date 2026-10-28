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

export function calcularRanking(): PuestoRanking[] {
  const todosLosRegalos = db
    .select({
      id: gifts.id,
      title: gifts.title,
      photoUrl: gifts.photoUrl,
      receiverId: gifts.receiverId,
      receiverName: participants.name,
    })
    .from(gifts)
    .leftJoin(participants, eq(gifts.receiverId, participants.id))
    .all();

  const puestos = todosLosRegalos.map((regalo) => {
    const reseñasRegalo = db
      .select()
      .from(reviews)
      .where(eq(reviews.giftId, regalo.id))
      .all()
      .filter((r) => !r.hidden);

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
  });

  return puestos.sort(
    (a, b) => b.totalQuilates - a.totalQuilates || b.media - a.media || b.numReseñas - a.numReseñas
  );
}
