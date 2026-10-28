import crypto from "node:crypto";

/**
 * Baraja con Fisher-Yates usando crypto.randomInt (CSPRNG) y forma una única
 * cadena circular: participants[0] regala a participants[1], ..., el último
 * regala al primero. Así nadie se regala a sí mismo y no hay parejas
 * cruzadas (A↔B), todo es un solo ciclo.
 */
export function barajar<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export type Pareja<T> = { giver: T; receiver: T };

export function generarCadena<T>(participantIds: readonly T[]): Pareja<T>[] {
  if (participantIds.length < 3) {
    throw new Error("Hacen falta al menos 3 participantes para evitar parejas cruzadas.");
  }
  const orden = barajar(participantIds);
  return orden.map((giver, i) => ({
    giver,
    receiver: orden[(i + 1) % orden.length],
  }));
}

/** Para el botón "Reparar cadena": salta al participante dado de la cadena. */
export function repararCadena<T>(parejas: readonly Pareja<T>[], idQueSeVa: T): Pareja<T>[] {
  const saliente = parejas.find((p) => p.giver === idQueSeVa);
  const entrante = parejas.find((p) => p.receiver === idQueSeVa);
  if (!saliente || !entrante) {
    throw new Error("Ese participante no está en la cadena actual.");
  }
  const reparada = { giver: entrante.giver, receiver: saliente.receiver };
  return parejas
    .filter((p) => p !== saliente && p !== entrante)
    .concat(reparada);
}
