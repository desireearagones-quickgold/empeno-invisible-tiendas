import { eq, like } from "drizzle-orm";
import { db } from "@/db/client";
import { assignments, config, fichas, participants } from "@/db/schema";
import { calendario } from "@/lib/calendario";
import { hashId } from "@/lib/crypto";
import { enviarWhatsApp } from "@/lib/whatsapp";

// Avisos por WhatsApp que se mandan solos (no hay grupo de la oficina donde
// pegarlos a mano). Cada uno es una plantilla de Meta con un botón cuya URL
// base es https://<dominio>/ir/ ; aquí solo se manda el trozo de detrás:
// "<destino>/<token>", que entra con la sesión de esa persona y la lleva a
// la página que toca.

export const DESTINOS = ["caja", "mis-fichas", "resenas"] as const;
export type Destino = (typeof DESTINOS)[number];

// El idioma tiene que ser el que se eligió al crear la plantilla en Meta
// (aunque el texto sea en castellano); si no, Meta dice que no existe.
type Plantilla = { nombre: string; idioma: string };

export const PLANTILLAS = {
  pista: { nombre: "nueva_pista", idioma: "es" },
  recordatorio: { nombre: "recordatorio_pista", idioma: "es" },
  regalos: { nombre: "abrir_regalos_2", idioma: "en" },
} as const satisfies Record<string, Plantilla>;

type Participante = typeof participants.$inferSelect;

type Aviso = {
  id: string;
  titulo: string;
  fecha: Date;
  plantilla: Plantilla;
  destino: Destino;
  destinatarios: (todos: Participante[]) => Promise<Participante[]>;
};

const DIA = 86_400_000;
// Un aviso que se quedó sin mandar (p. ej. un día que falló) ya no se manda
// pasado este margen: "tienes una pista nueva" de hace una semana confunde.
const MARGEN = 2 * DIA;

async function autoresDeFicha(numero: number): Promise<Set<string>> {
  const filas = await db.select({ autor: fichas.authorHash }).from(fichas).where(eq(fichas.number, numero));
  return new Set(filas.map((f) => f.autor));
}

/** Quien todavía no ha escrito su pista N. */
async function sinPistaEscrita(todos: Participante[], numero: number) {
  const autores = await autoresDeFicha(numero);
  return todos.filter((p) => !autores.has(hashId(p.id)));
}

/** Quien tiene esperando una pista N (su amigo invisible sí la escribió). */
async function conPistaEsperando(todos: Participante[], numero: number) {
  const autores = await autoresDeFicha(numero);
  const parejas = await db.select({ da: assignments.giverHash, recibe: assignments.receiverHash }).from(assignments);
  const reciben = new Set(parejas.filter((p) => autores.has(p.da)).map((p) => p.recibe));
  return todos.filter((p) => reciben.has(hashId(p.id)));
}

export function avisos(): Aviso[] {
  const cal = calendario();
  const lista: Aviso[] = [];
  for (const n of [1, 2, 3] as const) {
    lista.push({
      id: `recordatorio-${n}`,
      titulo: `Recordatorio para escribir la pista ${n}`,
      // El viernes antes de que se abra (el límite para escribirla es el domingo).
      fecha: new Date(cal.fichas[n - 1].getTime() - 3 * DIA),
      plantilla: PLANTILLAS.recordatorio,
      destino: "mis-fichas",
      destinatarios: (todos) => sinPistaEscrita(todos, n),
    });
    lista.push({
      id: `pista-${n}`,
      titulo: `Pista ${n} disponible`,
      fecha: cal.fichas[n - 1],
      plantilla: PLANTILLAS.pista,
      destino: "caja",
      destinatarios: (todos) => conPistaEsperando(todos, n),
    });
  }
  lista.push({
    id: "regalos",
    titulo: "Ya se pueden subir y valorar los regalos",
    fecha: cal.entrega,
    plantilla: PLANTILLAS.regalos,
    destino: "resenas",
    destinatarios: async (todos) => todos,
  });
  return lista.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}

export type ResultadoAviso = {
  id: string;
  titulo: string;
  fecha: string;
  estado: "pendiente" | "toca" | "pasado";
  /** A cuántos les llegaría (o llegó) según cómo están las cosas ahora. */
  destinatarios: number;
  enviados: number;
  errores: string[];
};

const clave = (avisoId: string, participanteId: string) => `aviso:${avisoId}:${participanteId}`;

/**
 * Revisa todos los avisos y, si `enviar`, manda los que tocan hoy a quien
 * aún no lo haya recibido. Cada envío queda apuntado por persona, así que
 * repetir la llamada nunca manda dos veces el mismo aviso a nadie.
 */
export async function procesarAvisos({ enviar, ahora = new Date() }: { enviar: boolean; ahora?: Date }) {
  const todos = (await db.select().from(participants)).filter((p) => p.phone);
  const yaEnviados = new Set(
    (await db.select({ key: config.key }).from(config).where(like(config.key, "aviso:%"))).map((r) => r.key)
  );

  const resultados: ResultadoAviso[] = [];
  for (const aviso of avisos()) {
    const pasado = ahora.getTime() - aviso.fecha.getTime();
    const estado = pasado < 0 ? "pendiente" : pasado < MARGEN ? "toca" : "pasado";
    const destinatarios = await aviso.destinatarios(todos);
    const pendientes = destinatarios.filter((p) => !yaEnviados.has(clave(aviso.id, p.id)));

    const resultado: ResultadoAviso = {
      id: aviso.id,
      titulo: aviso.titulo,
      fecha: aviso.fecha.toISOString(),
      estado,
      destinatarios: destinatarios.length,
      enviados: destinatarios.length - pendientes.length,
      errores: [],
    };

    if (enviar && estado === "toca") {
      // De 6 en 6: uno detrás de otro tardaría demasiado para la función de Vercel.
      for (let i = 0; i < pendientes.length; i += 6) {
        await Promise.all(
          pendientes.slice(i, i + 6).map(async (p) => {
            try {
              await enviarWhatsApp(p.phone!, {
                template: aviso.plantilla.nombre,
                lang: aviso.plantilla.idioma,
                botonSufijo: `${aviso.destino}/${p.accessToken}`,
              });
              await db
                .insert(config)
                .values({ key: clave(aviso.id, p.id), value: new Date().toISOString() })
                .onConflictDoNothing();
              resultado.enviados++;
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
