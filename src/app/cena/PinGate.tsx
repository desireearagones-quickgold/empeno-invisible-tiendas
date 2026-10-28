"use client";

import { useState } from "react";
import type { PuestoRanking } from "@/lib/ranking";
import Presentacion from "./Presentacion";

export default function PinGate() {
  const [pin, setPin] = useState("");
  const [ranking, setRanking] = useState<PuestoRanking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const res = await fetch("/api/cena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    setCargando(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setRanking(data.ranking);
  }

  if (ranking) return <Presentacion ranking={ranking} />;

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6 bg-black text-white">
      <h1 className="text-2xl font-bold text-(--color-dorado)">El Empeño Invisible — Resultados</h1>
      <form onSubmit={entrar} className="flex flex-col gap-3 w-full max-w-xs">
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN de la cena"
          className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-center tracking-[0.5em] text-white focus:border-(--color-dorado) focus:outline-none"
        />
        <button
          type="submit"
          disabled={cargando}
          className="rounded-md bg-(--color-dorado) px-4 py-2 font-semibold text-black disabled:opacity-60"
        >
          {cargando ? "Comprobando…" : "Entrar"}
        </button>
        {error && <p className="text-center text-sm text-red-400">{error}</p>}
      </form>
    </main>
  );
}
