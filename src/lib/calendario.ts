// En las tiendas no hay calendario: el sorteo se hace desde el panel cuando
// se quiera, y cada pista le llega a quien la recibe al día siguiente de
// escribirla, a las 9:00 de Madrid. No al momento a propósito: muchas
// trabajan juntas, y si la pista apareciera al guardarla se sabría quién la
// acaba de escribir.

const ZONA = "Europe/Madrid";
export const HORA_PISTA = 9;

/** Desfase de Madrid respecto a UTC en esa fecha, ej. "+01:00". */
function desfaseMadrid(d: Date): string {
  const nombre = new Intl.DateTimeFormat("en-US", { timeZone: ZONA, timeZoneName: "longOffset" })
    .formatToParts(d)
    .find((p) => p.type === "timeZoneName")!.value; // "GMT+01:00"
  return nombre === "GMT" ? "+00:00" : nombre.slice(3);
}

/**
 * Cuándo se abre una pista escrita en `escrita`: el día siguiente (en hora
 * de Madrid, no la del servidor, que en Vercel es UTC) a las 9:00.
 */
export function aperturaPista(escrita: Date): Date {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(escrita)
    .split("-")
    .map(Number);
  const manana = new Date(Date.UTC(y, m - 1, d + 1, 12)); // a mediodía, para coger el desfase de ese día
  const hh = String(HORA_PISTA).padStart(2, "0");
  return new Date(`${manana.toISOString().slice(0, 10)}T${hh}:00:00${desfaseMadrid(manana)}`);
}

export function pistaAbierta(abreEn: string | Date, ahora = new Date()): boolean {
  return ahora >= new Date(abreEn);
}
