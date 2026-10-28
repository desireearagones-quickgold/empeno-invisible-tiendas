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

function domingoAnterior(d: Date): Date {
  const copia = new Date(d);
  const diasDesdeDomingo = copia.getDay(); // 0 = domingo
  copia.setDate(copia.getDate() - diasDesdeDomingo - (diasDesdeDomingo === 0 ? 7 : 0));
  copia.setHours(23, 59, 0, 0);
  return copia;
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
