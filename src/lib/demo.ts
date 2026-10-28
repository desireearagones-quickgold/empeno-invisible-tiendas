import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { config } from "@/db/schema";
import type { PuestoRanking } from "@/lib/ranking";

export function modoDemoActivo(): boolean {
  return db.select().from(config).where(eq(config.key, "modo_demo")).get()?.value === "true";
}

export function activarModoDemo(activar: boolean) {
  db.insert(config)
    .values({ key: "modo_demo", value: String(activar) })
    .onConflictDoUpdate({ target: config.key, set: { value: String(activar) } })
    .run();
}

export const RANKING_DEMO: PuestoRanking[] = [
  {
    giftId: "demo-1",
    title: "Taza \"Billete de 500 €\" con su cara, para Juan",
    photoUrl: null,
    receiverName: "Juan",
    totalQuilates: 110,
    media: 4.8,
    numReseñas: 23,
    mejoresReseñas: [
      "Pieza única, tasación al alza.",
      "El tasador se quedó sin palabras.",
      "Oro de 24 quilates de humor.",
    ],
  },
  {
    giftId: "demo-2",
    title: "Caja fuerte de juguete con pepitas de chocolate, para Marta",
    photoUrl: null,
    receiverName: "Marta",
    totalQuilates: 86,
    media: 4.5,
    numReseñas: 19,
    mejoresReseñas: ["Valor de reventa altísimo.", "Se funde pero no se devalúa."],
  },
  {
    giftId: "demo-3",
    title: "Báscula de bolsillo \"para pesar tus excusas\", para Luis",
    photoUrl: null,
    receiverName: "Luis",
    totalQuilates: 70,
    media: 4.1,
    numReseñas: 17,
    mejoresReseñas: ["Pesa justo lo que pesan sus excusas."],
  },
];
