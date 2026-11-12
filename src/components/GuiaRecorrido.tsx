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

// Sin fechas: en las tiendas cada pista llega al día siguiente de escribirla.
const PASOS = [
  {
    ruta: "/contrato",
    titulo: "Tu contrato",
    texto:
      "Aquí puedes volver siempre que quieras a ver a quién le regalas (solo lo ves tú). Al lado tienes tu número de lote: en la cena, tu regalo será el paquete con ese número. El que tú regalas va envuelto y con el lote de tu contrato escrito, nunca con un nombre.",
  },
  {
    ruta: "/mis-fichas",
    titulo: "Escribe pistas sobre ti",
    texto:
      "Escribe tres pistas sobre ti, cuando quieras. Cada una le llega a la persona a la que regalas a las 9:00 del día siguiente de guardarla, así no sabrá que la acabas de escribir tú aunque esté a tu lado. Habla de ti, no del regalo.",
  },
  {
    ruta: "/caja",
    titulo: "Tus pistas",
    texto:
      "Aquí te llegan las pistas que te deja quien te regala a ti. Te avisaremos por WhatsApp cuando haya una nueva. ¡A ver si adivinas quién es antes de la cena!",
  },
];

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

export default function GuiaRecorrido() {
  const pathname = usePathname();
  const router = useRouter();
  const paso = useSyncExternalStore(suscribir, leer, () => null);
  const lista = PASOS;

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
