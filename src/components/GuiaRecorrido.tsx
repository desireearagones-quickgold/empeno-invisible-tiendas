"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

// El paso va en localStorage: es solo una comodidad de cada móvil, y así si
// recarga la página a mitad sigue por donde iba.
const CLAVE = "empeno-guia";
const EVENTO_CAMBIO = "empeno:guia";

/** Arranca el recorrido desde cualquier sitio (el contrato al abrir el sobre, el enlace "Ver cómo funciona"). */
export function empezarGuia() {
  guardar(1);
}

function suscribir(aviso: () => void) {
  window.addEventListener(EVENTO_CAMBIO, aviso);
  window.addEventListener("storage", aviso);
  return () => {
    window.removeEventListener(EVENTO_CAMBIO, aviso);
    window.removeEventListener("storage", aviso);
  };
}

export type FechasGuia = { limites: string[]; fichas: string[]; entrega: string };

function dias(isos: string[]) {
  const fechas = isos.map((i) => new Date(i));
  const mes = (d: Date) => d.toLocaleDateString("es-ES", { month: "long", timeZone: "Europe/Madrid" });
  const dia = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", timeZone: "Europe/Madrid" });
  const mismoMes = fechas.every((d) => mes(d) === mes(fechas[0]));
  const partes = fechas.map((d) => (mismoMes ? dia(d) : `${dia(d)} de ${mes(d)}`));
  const lista = `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
  return mismoMes ? `${lista} de ${mes(fechas[0])}` : lista;
}

function pasos(f: FechasGuia) {
  const entrega = new Date(f.entrega).toLocaleDateString("es-ES", { day: "numeric", month: "long", timeZone: "Europe/Madrid" });
  return [
    {
      ruta: "/contrato",
      titulo: "Tu contrato",
      texto:
        "Aquí puedes volver siempre que quieras a ver a quién le regalas (solo lo ves tú) y tu número de lote. El regalo va envuelto y con ese número escrito, nunca con un nombre.",
    },
    {
      ruta: "/mis-fichas",
      titulo: "Escribe pistas sobre ti",
      texto: `Escribe tres pistas sobre ti. Lo mejor es dejarlas todas escritas ya: la persona a la que regalas recibirá una cada lunes para intentar adivinar quién es. Puedes corregir cada una hasta el domingo antes de que se entregue (${dias(f.limites)}). Habla de ti, no del regalo.`,
    },
    {
      ruta: "/caja",
      titulo: "Tus pistas",
      texto: `Aquí te llegan las pistas que te deja quien te regala a ti: una cada lunes (${dias(f.fichas)}). Te avisaremos por WhatsApp cuando haya una nueva.`,
    },
    {
      ruta: "/caja",
      titulo: "Y al final, los regalos",
      texto: `El ${entrega} se entregan los regalos. Ese día subes la foto del tuyo y valoras los de los demás. Cuando se cierren las valoraciones, saldrá el regalo ganador.`,
    },
  ];
}

function leer(): number | null {
  try {
    const v = Number(localStorage.getItem(CLAVE));
    return Number.isInteger(v) && v >= 1 ? v : null;
  } catch {
    return null;
  }
}

function guardar(paso: number | null) {
  try {
    if (paso === null) localStorage.removeItem(CLAVE);
    else localStorage.setItem(CLAVE, String(paso));
  } catch {}
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

export default function GuiaRecorrido({ fechas }: { fechas: FechasGuia }) {
  const pathname = usePathname();
  const router = useRouter();
  const paso = useSyncExternalStore(suscribir, leer, () => null);
  const lista = pasos(fechas);

  if (paso === null || paso > lista.length) return null;
  const actual = lista[paso - 1];
  const ultimo = paso === lista.length;
  const ir = guardar;

  function siguiente() {
    if (ultimo) {
      ir(null);
      router.push("/mis-fichas");
      return;
    }
    ir(paso! + 1);
    const ruta = lista[paso!].ruta;
    if (ruta !== pathname) router.push(ruta);
  }

  return (
    <div className="print:hidden fixed inset-x-0 bottom-0 z-40 p-3 sm:bottom-4 sm:left-auto sm:right-4 sm:w-96">
      <div className="rounded-lg border border-(--color-dorado)/50 bg-(--color-negro) p-4 text-sm shadow-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-(--color-dorado)">
          Cómo funciona · paso {paso} de {lista.length}
        </p>
        <p className="mt-1 text-base font-semibold">{actual.titulo}</p>
        <p className="mt-1 text-white/70">{actual.texto}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button onClick={() => ir(null)} className="text-xs text-white/50 underline">
            Saltar
          </button>
          {actual.ruta !== pathname && !ultimo ? (
            <button
              onClick={() => router.push(actual.ruta)}
              className="rounded-md bg-(--color-dorado) px-4 py-2 font-semibold text-(--color-negro)"
            >
              Ir a «{actual.titulo}»
            </button>
          ) : (
            <button
              onClick={siguiente}
              className="rounded-md bg-(--color-dorado) px-4 py-2 font-semibold text-(--color-negro)"
            >
              {ultimo ? "¡A jugar! Escribir mi pista" : "Siguiente →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
