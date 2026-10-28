"use client";

import { useState } from "react";
import { CAMPOS_FICHA, MAX_CARACTERES_CAMPO, contieneNombre } from "@/lib/validacionFicha";

type Estado = "sin-escribir" | "guardada" | "entregada" | "plazo-perdido";

export default function TarjetaFicha({
  numero,
  cerrada,
  fechaLimite,
  camposGuardados,
  nombrePropio,
}: {
  numero: 1 | 2 | 3;
  cerrada: boolean;
  fechaLimite: string;
  camposGuardados: Record<string, string> | null;
  nombrePropio: string;
}) {
  const definicion = CAMPOS_FICHA[numero];
  const [valores, setValores] = useState<Record<string, string>>(
    camposGuardados ?? Object.fromEntries(definicion.map((c) => [c.clave, ""]))
  );
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const estado: Estado = cerrada
    ? camposGuardados
      ? "entregada"
      : "plazo-perdido"
    : camposGuardados
      ? "guardada"
      : "sin-escribir";

  async function guardar() {
    const avisos = definicion.filter((c) => contieneNombre(valores[c.clave] ?? "", nombrePropio));
    if (avisos.length > 0) {
      const continuar = window.confirm(
        `Parece que has escrito tu nombre en "${avisos[0].etiqueta}". ¿Seguro que quieres guardarlo así?`
      );
      if (!continuar) return;
    }

    setGuardando(true);
    setMensaje(null);
    const res = await fetch("/api/fichas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: numero, fields: valores }),
    });
    const data = await res.json();
    setMensaje(res.ok ? data.mensaje : data.error);
    setGuardando(false);
  }

  const etiquetaDificultad = { 1: "difícil", 2: "media", 3: "fácil" }[numero];

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Ficha {numero} <span className="text-white/40 text-sm">({etiquetaDificultad})</span></h2>
        <span
          className={
            "text-xs rounded-full px-2 py-0.5 " +
            (estado === "entregada"
              ? "bg-white/10 text-white/50"
              : estado === "plazo-perdido"
                ? "bg-red-500/20 text-red-300"
                : estado === "guardada"
                  ? "bg-(--color-dorado)/20 text-(--color-dorado)"
                  : "bg-white/10 text-white/70")
          }
        >
          {estado === "entregada"
            ? "Entregada"
            : estado === "plazo-perdido"
              ? "Sin escribir — plazo cerrado"
              : estado === "guardada"
                ? "Guardada"
                : "Sin escribir"}
        </span>
      </div>

      {estado === "entregada" || estado === "plazo-perdido" ? (
        <p className="text-sm text-white/50">
          {estado === "entregada"
            ? `Entregada el ${new Date(fechaLimite).toLocaleString("es-ES")}: ya no se puede editar.`
            : `No llegaste a escribirla antes del plazo (${new Date(fechaLimite).toLocaleString("es-ES")}). Tu compañero/a se quedará sin esta pista.`}
        </p>
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
                placeholder={campo.placeholder}
                className="mt-1 w-full rounded border border-white/15 bg-black/30 px-2 py-1 text-sm placeholder:text-white/30 focus:border-(--color-dorado) focus:outline-none"
              />
              <span className="mt-0.5 block text-xs text-white/30">Ej: {campo.placeholder}</span>
            </label>
          ))}
          <div className="mt-auto space-y-2 pt-2">
            <button
              onClick={guardar}
              disabled={guardando}
              className="w-full rounded bg-(--color-dorado) py-1.5 text-sm font-semibold text-(--color-negro) disabled:opacity-60"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            {mensaje && <p className="text-xs text-white/60">{mensaje}</p>}
          </div>
        </>
      )}
    </div>
  );
}
