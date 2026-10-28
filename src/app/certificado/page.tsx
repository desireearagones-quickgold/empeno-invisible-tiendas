"use client";

import { useState } from "react";
import LogoQuickgold from "@/components/LogoQuickgold";

export default function Certificado() {
  const [linea1, setLinea1] = useState("");
  const [linea2, setLinea2] = useState("");

  return (
    <main className="flex-1 p-6 max-w-xl mx-auto w-full space-y-6 print:p-0">
      <div className="print:hidden space-y-3">
        <h1 className="text-2xl font-bold">Certificado de autenticidad</h1>
        <p className="text-white/60 text-sm">
          Escribe dos líneas para tu regalo y pulsa &quot;Imprimir / Guardar como PDF&quot;. No se guarda nada: todo
          se queda en tu navegador.
        </p>
        <input
          value={linea1}
          onChange={(e) => setLinea1(e.target.value)}
          placeholder="Primera línea"
          className="w-full rounded border border-white/15 bg-black/30 px-3 py-2 text-sm placeholder:text-white/30 focus:border-(--color-dorado) focus:outline-none"
        />
        <input
          value={linea2}
          onChange={(e) => setLinea2(e.target.value)}
          placeholder="Segunda línea"
          className="w-full rounded border border-white/15 bg-black/30 px-3 py-2 text-sm placeholder:text-white/30 focus:border-(--color-dorado) focus:outline-none"
        />
        <button
          onClick={() => window.print()}
          className="rounded bg-(--color-dorado) px-4 py-2 text-sm font-semibold text-black"
        >
          Imprimir / Guardar como PDF
        </button>
      </div>

      <div
        className="documento mx-auto border-4 border-double border-(--color-dorado-oscuro) bg-(--color-crema) p-8 text-center text-(--color-negro) print:border-2"
        style={{ width: "105mm", height: "148mm" }}
      >
        <LogoQuickgold sobreClaro width={80} className="mx-auto" />
        <h2 className="mt-4 text-lg font-bold">CERTIFICADO DE AUTENTICIDAD</h2>
        <p className="mt-2 text-xs text-black/60">Pieza única</p>
        <div className="mt-8 space-y-2 text-sm">
          <p>{linea1 || "—"}</p>
          <p>{linea2 || "—"}</p>
        </div>
      </div>
    </main>
  );
}
