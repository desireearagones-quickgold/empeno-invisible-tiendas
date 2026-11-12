"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CAMPOS_FICHA } from "@/lib/validacionFicha";

type Resultado = { campos?: Record<string, string> };

export default function Compartimento({
  numero,
  desbloqueada,
  campos,
  visto,
}: {
  numero: 1 | 2 | 3;
  desbloqueada: boolean;
  campos: Record<string, string> | null;
  visto: boolean;
}) {
  const reducida = useReducedMotion();
  const [abriendo, setAbriendo] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(visto && campos ? { campos } : null);
  const [error, setError] = useState<string | null>(null);

  async function abrir() {
    setAbriendo(true);
    setError(null);
    const res = await fetch(`/api/caja/${numero}`, { method: "POST" });
    const data = await res.json().catch(() => ({ error: "No se ha podido abrir. Prueba otra vez." }));
    if (!res.ok) {
      setError(data.error);
      setAbriendo(false);
      return;
    }
    setTimeout(() => {
      setResultado(data);
      setAbriendo(false);
    }, reducida ? 0 : 1600);
  }

  if (!desbloqueada) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center space-y-2">
        <div className="text-3xl">🔒</div>
        <p className="font-semibold">Pista {numero}</p>
        <p className="text-xs text-white/50">Todavía no ha llegado. Te avisaremos por WhatsApp.</p>
      </div>
    );
  }

  if (resultado) {
    const definicion = CAMPOS_FICHA[numero];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reducida ? 0.01 : 0.5 }}
        className="documento rounded-sm border border-(--color-dorado-oscuro)/40 bg-(--color-crema) p-4 text-(--color-negro)"
      >
        <p className="text-center text-xs tracking-widest text-(--color-dorado-oscuro)">TASACIÓN Nº {numero}</p>
        <dl className="mt-2 space-y-1 text-sm">
          {definicion.map((c) => (
            <div key={c.clave}>
              <dt className="font-semibold">{c.etiqueta}</dt>
              <dd>{resultado.campos?.[c.clave] || "—"}</dd>
            </div>
          ))}
        </dl>
      </motion.div>
    );
  }

  return (
    <div className="rounded-lg border border-(--color-dorado)/40 bg-(--color-dorado)/10 p-4 text-center space-y-2">
      <div className="text-3xl">✨</div>
      <p className="font-semibold">Pista {numero}</p>
      <p className="text-xs text-(--color-dorado)">Nueva pista</p>
      <button
        onClick={abrir}
        disabled={abriendo}
        className="w-full rounded bg-(--color-dorado) py-1.5 text-sm font-semibold text-(--color-negro) disabled:opacity-60"
      >
        {abriendo ? "Girando la rueda…" : "Abrir"}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
