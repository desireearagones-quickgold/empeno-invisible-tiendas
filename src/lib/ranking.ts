import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { gifts, reviews, participants } from "@/db/schema";
import { hashId } from "@/lib/crypto";

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
  autor: string | null;
};

/**
 * Las reseñas de un regalo con el nombre de quien las escribió. Solo para la
 * página de Resultados: mientras el plazo está abierto son anónimas, y al
 * salir los resultados se destapan (decisión de las organizadoras). En la
 * base solo hay el hash de quien reseñó, así que se busca a quién
 * corresponde comparando con el hash de cada participante.
 */
export async function reseñasDeRegalo(giftId: string): Promise<ReseñaPublica[]> {
  const filas = await db
    .select({
      id: reviews.id,
      quilates: reviews.quilates,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      hidden: reviews.hidden,
      reviewerHash: reviews.reviewerHash,
    })
    .from(reviews)
    .where(eq(reviews.giftId, giftId));

  const nombrePorHash = new Map(
    (await db.select({ id: participants.id, name: participants.name }).from(participants)).map((p) => [
      hashId(p.id),
      p.name,
    ])
  );

  return filas
    .filter((r) => !r.hidden)
    .map(({ id, quilates, comment, createdAt, reviewerHash }) => ({
      id,
      quilates,
      comment,
      createdAt,
      autor: nombrePorHash.get(reviewerHash) ?? null,
    }));
}
