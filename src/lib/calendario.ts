// Todas las fechas del calendario viven en variables de entorno (ver .env.example),
// nunca escritas a mano en el código. El domingo anterior a cada ficha es el
// límite de edición; se calcula, no se guarda aparte, para no duplicar la lista.

function fecha(envVar: string): Date {
  const raw = process.env[envVar];
  if (!raw) {
    throw new Error(`Falta la variable de entorno ${envVar} con la fecha del calendario.`);
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`La variable ${envVar} no es una fecha válida: "${raw}"`);
  }
  return d;
}

const ZONA = "Europe/Madrid";

/** Desfase de Madrid respecto a UTC en esa fecha, ej. "+01:00". */
function desfaseMadrid(d: Date): string {
  const nombre = new Intl.DateTimeFormat("en-US", { timeZone: ZONA, timeZoneName: "longOffset" })
    .formatToParts(d)
    .find((p) => p.type === "timeZoneName")!.value; // "GMT+01:00"
  return nombre === "GMT" ? "+00:00" : nombre.slice(3);
}

// En hora de Madrid a propósito: Vercel corre en UTC, y con getDay/setHours
// del servidor el límite quedaba en lunes a las 00:59 en vez de domingo 23:59.
function domingoAnterior(d: Date): Date {
  const [y, m, dia] = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(d)
    .split("-")
    .map(Number);
  const diaSemana = new Date(Date.UTC(y, m - 1, dia)).getUTCDay(); // 0 = domingo
  const domingo = new Date(Date.UTC(y, m - 1, dia - (diaSemana === 0 ? 7 : diaSemana)));
  return new Date(`${domingo.toISOString().slice(0, 10)}T23:59:00${desfaseMadrid(domingo)}`);
}

export function calendario() {
  const sorteo = fecha("DATE_SORTEO");
  const fichas = [fecha("DATE_FICHA_1"), fecha("DATE_FICHA_2"), fecha("DATE_FICHA_3")] as const;
  const entrega = fecha("DATE_ENTREGA");
  const cierreResenas = fecha("DATE_CIERRE_RESENAS");

  return {
    sorteo,
    fichas,
    limiteFicha: fichas.map(domingoAnterior) as [Date, Date, Date],
    entrega,
    cierreResenas,
  };
}

export function sorteoAbierto(ahora = new Date()): boolean {
  return ahora >= calendario().sorteo;
}

/** Fecha en la que se desbloquea la ficha N (1-indexada) para su destinatario. */
export function fichaDesbloqueada(numero: 1 | 2 | 3, ahora = new Date()): boolean {
  return ahora >= calendario().fichas[numero - 1];
}

/** Si ya pasó el límite para escribir/editar la ficha N. */
export function fichaCerrada(numero: 1 | 2 | 3, ahora = new Date()): boolean {
  return ahora >= calendario().limiteFicha[numero - 1];
}

export function resenasAbiertas(ahora = new Date()): boolean {
  const c = calendario();
  return ahora >= c.entrega && ahora <= c.cierreResenas;
}

/** La página de resultados se abre en cuanto se cierran las reseñas. */
export function resultadosAbiertos(ahora = new Date()): boolean {
  return ahora > calendario().cierreResenas;
}
