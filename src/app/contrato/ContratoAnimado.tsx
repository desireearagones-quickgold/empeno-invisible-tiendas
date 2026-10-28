"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import LogoQuickgold from "@/components/LogoQuickgold";

export default function ContratoAnimado({
  yaVisto,
  contractNumber,
  nombreDepositante,
  nombreReceptor,
  fechaOperacion,
  fechaDevolucion,
}: {
  yaVisto: boolean;
  contractNumber: string;
  nombreDepositante: string;
  nombreReceptor: string;
  fechaOperacion: string;
  fechaDevolucion: string;
}) {
  const [mostrarAnimacion, setMostrarAnimacion] = useState(!yaVisto);
  const [abierto, setAbierto] = useState(yaVisto);
  const reducida = useReducedMotion();
  const [fechaImpresion] = useState(() => new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }));

  useEffect(() => {
    if (!yaVisto) {
      fetch("/api/contrato/visto", { method: "POST" }).catch(() => {});
    }
  }, [yaVisto]);

  function abrir() {
    setAbierto(true);
    if (reducida) {
      setMostrarAnimacion(false);
      return;
    }
    setTimeout(() => setMostrarAnimacion(false), 2200);
  }

  return (
    // print:hidden a propósito: esta pantalla dice a quién regalas y NUNCA
    // debe poder imprimirse ni guardarse en PDF (solo el ticket de recogida
    // de abajo es imprimible). Ver TicketRecogida.tsx.
    <div className="h-full w-full max-w-md print:hidden">
      <AnimatePresence mode="wait">
        {mostrarAnimacion ? (
          <motion.button
            key="sobre"
            onClick={abrir}
            className="relative mx-auto flex h-48 w-72 items-center justify-center rounded-md bg-(--color-crema) shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: reducida ? 0.01 : 0.4 }}
          >
            <motion.div
              className="absolute inset-x-0 top-0 h-24 origin-top bg-(--color-crema)"
              style={{ clipPath: "polygon(0 0, 50% 60%, 100% 0)" }}
              animate={abierto ? { rotateX: 180 } : { rotateX: 0 }}
              transition={{ duration: reducida ? 0.01 : 0.8, delay: 0.1 }}
            />
            <motion.div
              className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-dorado-oscuro) text-(--color-crema) shadow-lg"
              animate={abierto ? { scale: [1, 1.3, 0], rotate: 15 } : { scale: 1 }}
              transition={{ duration: reducida ? 0.01 : 0.6, delay: 0.3 }}
            >
              ✦
            </motion.div>
            {!abierto && <span className="absolute bottom-3 text-sm text-black/50">Toca para abrir</span>}
          </motion.button>
        ) : (
          <motion.div
            key="contrato"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: reducida ? 0.01 : 0.5 }}
            className="documento flex h-full flex-col rounded-sm border border-black/10 bg-(--color-crema) p-6 text-(--color-negro) shadow-2xl text-sm"
          >
            <LogoQuickgold sobreClaro width={120} />
            <hr className="mt-2 border-black/20" />
            <h2 className="mt-3 text-center text-sm font-bold uppercase tracking-wide">Encargo de custodia</h2>

            <div className="mt-4 flex justify-between gap-4 text-xs">
              <div>
                <p className="font-bold">{nombreDepositante}</p>
                <p className="text-black/60">Depositante (tú)</p>
              </div>
              <div className="text-right">
                <p className="font-bold">QUICKGOLD · El Empeño Invisible</p>
                <p className="text-black/60">Fecha del sorteo: {fechaOperacion}</p>
                <p className="text-black/60">Fecha de consulta: {fechaImpresion}</p>
              </div>
            </div>

            <table className="mt-4 w-full border-collapse text-xs">
              <thead>
                <tr className="border-y border-black/20 bg-black/5 text-left">
                  <th className="py-1">Concepto</th>
                  <th className="py-1 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black/10">
                  <td className="py-1">
                    A quién le regalas
                    <br />
                    <span className="text-black/50">(la &quot;joya&quot;, solo para ti)</span>
                  </td>
                  <td className="py-1 text-right font-semibold align-top">{nombreReceptor}</td>
                </tr>
                <tr className="border-b border-black/10">
                  <td className="py-1">Fecha de devolución<br /><span className="text-black/50">(entregas el regalo)</span></td>
                  <td className="py-1 text-right font-semibold align-top">{fechaDevolucion}</td>
                </tr>
                <tr>
                  <td className="py-1">Importe máximo</td>
                  <td className="py-1 text-right font-semibold">20,00 €</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-1 text-[10px] text-black/50">
              Ese nombre no lo escribas en ningún sitio: es solo para que sepas qué comprar.
            </p>

            <div className="mt-4 rounded border-2 border-(--color-dorado-oscuro) bg-(--color-dorado-oscuro)/10 py-3 text-center print:bg-transparent">
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/50">
                Esto sí va en el paquete, en vez del nombre
              </p>
              <p className="text-3xl font-bold tracking-wider">Lote {contractNumber}</p>
              <p className="mt-1 text-[10px] text-black/60">Es el único dato que debe llevar escrito el regalo.</p>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-black/70">
              <strong>Condiciones:</strong> hasta la fecha de devolución, no se puede contar a nadie quién es el
              depositante (o sea: no digas que el regalo es tuyo). El día de la entrega, el regalo se da envuelto
              y marcado solo con el código de lote de arriba, nunca con un nombre.
            </p>
            <div className="mt-auto pt-4">
              <p className="text-center text-[10px] text-black/40">
                Este encargo solo se ve en pantalla: no se imprime ni se guarda en PDF.
              </p>
              <button
                onClick={() => {
                  setAbierto(false);
                  setMostrarAnimacion(true);
                }}
                className="mt-2 w-full rounded-md border border-(--color-dorado-oscuro) py-2 text-sm font-semibold text-(--color-dorado-oscuro) hover:bg-(--color-dorado-oscuro)/10"
              >
                Volver a ver
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
