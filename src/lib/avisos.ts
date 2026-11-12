import { like } from "drizzle-orm";
import { db } from "@/db/client";
import { assignments, config, fichas, participants } from "@/db/schema";
import { pistaAbierta } from "@/lib/calendario";
import { hashId } from "@/lib/crypto";
import { enviarAvisoSorteoConBoton, enviarWhatsApp } from "@/lib/whatsapp";

// En las tiendas el único aviso automático es "tienes una pista nueva": cada
// pista llega a las 9:00 del día siguiente de escribirla, y el cron de las
// 9:15 avisa a quien le haya llegado alguna. Es una plantilla de Meta con un
// botón cuya URL base es https://<dominio>/ir/ ; aquí solo se manda el trozo
// de detrás: "<destino>/<token>".

export const DESTINOS = ["caja", "mis-fichas"] as const;
export type Destino = (typeof DESTINOS)[number];

// El idioma tiene que ser el que se eligió al crear la plantilla en Meta.
const PLANTILLA_PISTA = {
  nombre: process.env.WHATSAPP_PLANTILLA_PISTA ?? "nueva_pista",
  idioma: process.env.WHATSAPP_PLANTILLA_PISTA_IDIOMA ?? "es",
};

const DIA = 86_400_000;
// Una pista que llegó hace más de esto ya no se avisa (p. ej. si el cron
// falló un día): "tienes una pista nueva" de hace una semana confunde.
const MARGEN = 2 * DIA;

export type ResultadoAviso = {
  id: string;
  titulo: string;
  /** Personas con esta pista ya llegada. */
  destinatarios: number;
  enviados: number;
  /** A cuántos se les avisará en el próximo aviso de las 9:15. */
  pendientes: number;
  errores: string[];
};

const clave = (avisoId: string, participanteId: string) => `aviso:${avisoId}:${participanteId}`;

/**
 * Para cada pista (1, 2, 3), quién la tiene ya llegada y si se le ha avisado.
 * Si `enviar`, avisa a quien le falte. Cada envío queda apuntado por persona,
 * así que repetir la llamada nunca manda dos veces el mismo aviso a nadie.
 */
export async function procesarAvisos({ enviar, ahora = new Date() }: { enviar: boolean; ahora?: Date }) {
  const todos = await db.select().from(participants);
  const porHash = new Map(todos.map((p) => [hashId(p.id), p]));
  const parejas = await db.select({ da: assignments.giverHash, recibe: assignments.receiverHash }).from(assignments);
  const recibeDe = new Map(parejas.map((p) => [p.da, p.recibe]));
  const todasLasFichas = await db.select().from(fichas);
  const yaEnviados = new Set(
    (await db.select({ key: config.key }).from(config).where(like(config.key, "aviso:%"))).map((r) => r.key)
  );

  const resultados: ResultadoAviso[] = [];
  for (const n of [1, 2, 3] as const) {
    const id = `pista-${n}`;
    const llegadas = todasLasFichas
      .filter((f) => f.number === n && pistaAbierta(f.abreEn, ahora))
      .map((f) => ({ ficha: f, receptor: porHash.get(recibeDe.get(f.authorHash) ?? "") }))
      .filter((x): x is { ficha: typeof x.ficha; receptor: NonNullable<typeof x.receptor> } => Boolean(x.receptor));

    const sinAvisar = llegadas.filter((x) => !yaEnviados.has(clave(id, x.receptor.id)));
    // Sin teléfono no se le puede avisar: se cuenta, pero no se manda.
    const tocan = sinAvisar.filter(
      (x) => x.receptor.phone && ahora.getTime() - new Date(x.ficha.abreEn).getTime() < MARGEN
    );

    const resultado: ResultadoAviso = {
      id,
      titulo: `Pista ${n} nueva`,
      destinatarios: llegadas.length,
      enviados: llegadas.length - sinAvisar.length,
      pendientes: tocan.length,
      errores: [],
    };

    if (enviar) {
      // De 6 en 6: uno detrás de otro tardaría demasiado para la función de Vercel.
      for (let i = 0; i < tocan.length; i += 6) {
        await Promise.all(
          tocan.slice(i, i + 6).map(async ({ receptor: p }) => {
            try {
              await enviarWhatsApp(p.phone!, {
                template: PLANTILLA_PISTA.nombre,
                lang: PLANTILLA_PISTA.idioma,
                botonSufijo: `caja/${p.accessToken}`,
              });
              await db
                .insert(config)
                .values({ key: clave(id, p.id), value: new Date().toISOString() })
                .onConflictDoNothing();
              resultado.enviados++;
              resultado.pendientes--;
            } catch (err) {
              resultado.errores.push(`${p.name}: ${err instanceof Error ? err.message : "error desconocido"}`);
            }
          })
        );
      }
    }
    resultados.push(resultado);
  }
  return resultados;
}

// El WhatsApp del sorteo no es automático: se manda desde el panel, a una
// persona o a todas. Queda apuntado igual que los avisos, para que "Mandar a
// todos" se salte a quien ya lo tiene y se pueda pulsar otra vez sin repetir.
export const claveSorteo = (participanteId: string) => clave("sorteo", participanteId);

export async function mandarWhatsappSorteo(p: { id: string; phone: string; accessToken: string }) {
  await enviarAvisoSorteoConBoton(p.phone, p.accessToken);
  await db
    .insert(config)
    .values({ key: claveSorteo(p.id), value: new Date().toISOString() })
    .onConflictDoNothing();
}
