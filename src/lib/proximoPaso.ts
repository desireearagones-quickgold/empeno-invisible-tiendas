import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assignments, config, fichaOpens, fichas } from "@/db/schema";
import { hashId } from "@/lib/crypto";
import {
  calendario,
  fichaCerrada,
  fichaDesbloqueada,
  resenasAbiertas,
  resultadosAbiertos,
  sorteoAbierto,
} from "@/lib/calendario";

export type ProximoPaso = { texto: string; boton?: { etiqueta: string; href: string } };

const NUMEROS = [1, 2, 3] as const;

function dia(d: Date) {
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" });
}

/**
 * Lo siguiente que tiene que hacer esta persona, para guiarla por el
 * recorrido (abrir el sobre → escribir pistas → abrir las que le llegan →
 * regalos → resultados). Null si no hay nada que decir (antes del sorteo).
 */
export async function proximoPaso(participanteId: string, ahora = new Date()): Promise<ProximoPaso | null> {
  if (resultadosAbiertos(ahora)) {
    return { texto: "¡Ya están los resultados!", boton: { etiqueta: "Ver el regalo ganador", href: "/resultados" } };
  }
  if (resenasAbiertas(ahora)) {
    return {
      texto: "Ya se pueden abrir los regalos: sube la foto del tuyo y valora los de los demás.",
      boton: { etiqueta: "Ir a los regalos", href: "/resenas" },
    };
  }
  if (!sorteoAbierto(ahora)) return null;
  const [sorteo] = await db.select().from(config).where(eq(config.key, "sorteo_hecho"));
  if (sorteo?.value !== "true") return null;

  const yo = hashId(participanteId);
  const [miAsignacion] = await db.select().from(assignments).where(eq(assignments.giverHash, yo));
  if (!miAsignacion) return null;

  if (!miAsignacion.contractOpenedAt) {
    return { texto: "Abre tu sobre para saber a quién le regalas.", boton: { etiqueta: "Abrir mi sobre", href: "/contrato" } };
  }

  // ¿Le ha llegado una pista que aún no ha abierto?
  const [quienMeRegala] = await db.select().from(assignments).where(eq(assignments.receiverHash, yo));
  if (quienMeRegala) {
    for (const n of NUMEROS) {
      if (!fichaDesbloqueada(n, ahora)) continue;
      const [escrita] = await db
        .select({ id: fichas.id })
        .from(fichas)
        .where(and(eq(fichas.authorHash, quienMeRegala.giverHash), eq(fichas.number, n)));
      const [abierta] = await db
        .select()
        .from(fichaOpens)
        .where(and(eq(fichaOpens.receiverHash, yo), eq(fichaOpens.number, n)));
      if (escrita && !abierta) {
        return {
          texto: "Tu amigo invisible te ha dejado una pista nueva.",
          boton: { etiqueta: "Ver mi pista", href: "/caja" },
        };
      }
    }
  }

  // La próxima pista que le toca escribir y aún no ha escrito.
  const cal = calendario();
  for (const n of NUMEROS) {
    if (fichaCerrada(n, ahora)) continue;
    const [escrita] = await db
      .select({ id: fichas.id })
      .from(fichas)
      .where(and(eq(fichas.authorHash, yo), eq(fichas.number, n)));
    if (!escrita) {
      return {
        texto: `Escribe tu pista ${n} antes del ${dia(cal.limiteFicha[n - 1])}. Es lo que leerá la persona a la que regalas para intentar adivinar quién eres.`,
        boton: { etiqueta: `Escribir mi pista ${n}`, href: "/mis-fichas" },
      };
    }
  }

  const siguiente = NUMEROS.find((n) => !fichaDesbloqueada(n, ahora));
  if (siguiente) {
    return { texto: `Todo al día. Tu próxima pista llega el ${dia(cal.fichas[siguiente - 1])}.` };
  }
  return { texto: `Todo al día. Los regalos se abren el ${dia(cal.entrega)}.` };
}
