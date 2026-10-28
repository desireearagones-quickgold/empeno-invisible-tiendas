// Criterio de aceptación: con 30 participantes de prueba, el sorteo genera un
// único ciclo sin autoasignaciones ni parejas cruzadas (1.000 ejecuciones).
import { generarCadena } from "../src/lib/sorteo.ts";

const N = 30;
const RONDAS = 1000;
const participantes = Array.from({ length: N }, (_, i) => `p${i}`);

let fallos = 0;

for (let r = 0; r < RONDAS; r++) {
  const parejas = generarCadena(participantes);

  if (parejas.length !== N) {
    console.error(`Ronda ${r}: número de parejas incorrecto (${parejas.length})`);
    fallos++;
    continue;
  }

  // Nadie se regala a sí mismo.
  const autoasignado = parejas.find((p) => p.giver === p.receiver);
  if (autoasignado) {
    console.error(`Ronda ${r}: autoasignación detectada (${autoasignado.giver})`);
    fallos++;
    continue;
  }

  // No hay parejas cruzadas A↔B.
  const porGiver = new Map(parejas.map((p) => [p.giver, p.receiver]));
  const cruzada = parejas.find((p) => porGiver.get(p.receiver) === p.giver);
  if (cruzada) {
    console.error(`Ronda ${r}: pareja cruzada detectada (${cruzada.giver} <-> ${cruzada.receiver})`);
    fallos++;
    continue;
  }

  // Un único ciclo que recorre a todos: partiendo de p0 y siguiendo
  // receiver->receiver, se vuelve a p0 solo después de visitar a los N.
  let actual = participantes[0];
  const visitados = new Set();
  for (let i = 0; i < N; i++) {
    visitados.add(actual);
    actual = porGiver.get(actual);
  }
  if (actual !== participantes[0] || visitados.size !== N) {
    console.error(`Ronda ${r}: no forma un único ciclo (visitados=${visitados.size})`);
    fallos++;
  }
}

if (fallos > 0) {
  console.error(`\nFALLÓ: ${fallos}/${RONDAS} rondas con problemas.`);
  process.exit(1);
}

console.log(`OK: ${RONDAS} sorteos de ${N} personas, todos un único ciclo sin autoasignaciones ni cruces.`);
