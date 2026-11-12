"use client";

import { useState } from "react";
import { CAMPOS_FICHA, MAX_CARACTERES_CAMPO, contieneNombre } from "@/lib/validacionFicha";

type Estado = "sin-escribir" | "guardada" | "entregada";

const cuando = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });

export default function TarjetaFicha({
  numero,
  entregada,
  abreEn: abreEnInicial,
  camposGuardados,
  nombrePropio,
}: {
  numero: 1 | 2 | 3;
  entregada: boolean;
  abreEn: string | null;
  camposGuardados: Record<string, string> | null;
  nombrePropio: string;
}) {
  const definicion = CAMPOS_FICHA[numero];
  const [valores, setValores] = useState<Record<string, string>>(
    camposGuardados ?? Object.fromEntries(definicion.map((c) => [c.clave, ""]))
  );
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  // Guardar no recarga la página: la hora de llegada se lleva aquí.
  const [abreEn, setAbreEn] = useState(abreEnInicial);
  // window.confirm no sale en el navegador de dentro de WhatsApp: el aviso
  // de "has puesto tu nombre" va en la propia tarjeta.
  const [avisoNombre, setAvisoNombre] = useState<string | null>(null);

  const estado: Estado = entregada ? "entregada" : abreEn ? "guardada" : "sin-escribir";

  async function guardar(aunqueLleveNombre = false) {
    const conNombre = definicion.find((c) => contieneNombre(valores[c.clave] ?? "", nombrePropio));
    if (conNombre && !aunqueLleveNombre) {
      setAvisoNombre(conNombre.etiqueta);
      return;
    }
    setAvisoNombre(null);
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/fichas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: numero, fields: valores }),
      });
      const data = await res.json();
      if (res.ok) {
        setAbreEn(data.abreEn);
        setMensaje(`Pista guardada. Le llegará el ${cuando(data.abreEn)}.`);
      } else {
        setMensaje(data.error);
      }
    } catch {
      setMensaje("No se ha podido guardar. Revisa la conexión y prueba otra vez.");
    }
    setGuardando(false);
  }

  const etiquetaDificultad = { 1: "difícil", 2: "media", 3: "fácil" }[numero];

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Pista {numero} <span className="text-white/40 text-sm">({etiquetaDificultad})</span></h2>
        <span
          className={
            "text-xs rounded-full px-2 py-0.5 " +
            (estado === "entregada"
              ? "bg-white/10 text-white/50"
              : estado === "guardada"
                ? "bg-(--color-dorado)/20 text-(--color-dorado)"
                : "bg-white/10 text-white/70")
          }
        >
          {estado === "entregada" ? "Entregada" : estado === "guardada" ? "Guardada" : "Sin escribir"}
        </span>
      </div>

      {estado === "entregada" ? (
        <p className="text-sm text-white/50">Ya le ha llegado ({cuando(abreEn!)}): no se puede cambiar.</p>
      ) : (
        <>
          {definicion.map((campo) => (
            <label key={campo.clave} className="block text-sm">
              <span className="text-white/70">{campo.etiqueta}</span>
              <span className="block text-xs text-white/40">{campo.ayuda}</span>
              <input
                maxLength={MAX_CARACTERES_CAMPO}
                value={valores[campo.clave] ?? ""}
                onChange={(e) => setValores((v) => ({ ...v, [campo.clave]: e.target.value }))}
                className="mt-1 w-full rounded border border-white/15 bg-black/30 px-2 py-1 text-sm focus:border-(--color-dorado) focus:outline-none"
              />
              <span className="mt-0.5 block text-xs text-white/30">Ej: {campo.placeholder}</span>
            </label>
          ))}
          <div className="mt-auto space-y-2 pt-2">
            {estado === "guardada" && !mensaje && (
              <p className="text-xs text-white/50">Le llegará el {cuando(abreEn!)}. Hasta entonces puedes corregirla.</p>
            )}
            {avisoNombre ? (
              <div className="space-y-2 rounded border border-red-400/40 bg-red-500/10 p-2 text-xs">
                <p>Parece que has escrito tu nombre en «{avisoNombre}». ¿Seguro que quieres guardarla así?</p>
                <div className="flex gap-2">
                  <button onClick={() => setAvisoNombre(null)} className="flex-1 rounded bg-white/10 py-1">
                    Corregir
                  </button>
                  <button onClick={() => guardar(true)} className="flex-1 rounded bg-white/20 py-1">
                    Guardar igual
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => guardar()}
                disabled={guardando}
                className="w-full rounded bg-(--color-dorado) py-1.5 text-sm font-semibold text-(--color-negro) disabled:opacity-60"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            )}
            {mensaje && <p className="text-xs text-white/60">{mensaje}</p>}
          </div>
        </>
      )}
    </div>
  );
}
