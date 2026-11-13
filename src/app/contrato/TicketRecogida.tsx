"use client";

import LogoQuickgold from "@/components/LogoQuickgold";

/**
 * El lote de quien RECIBE: el número que llevará escrito su paquete en la
 * comida, para saber cuál es el suyo. A propósito nunca dice quién lo regala:
 * ese dato ni siquiera se consulta al construir esta pantalla.
 */
export default function TicketRecogida({
  contractNumber,
  nombreTitular,
}: {
  contractNumber: string;
  nombreTitular: string;
}) {
  return (
    <div className="h-full w-full max-w-md">
      <div className="documento flex h-full flex-col rounded-sm border border-black/10 bg-(--color-crema) p-6 text-(--color-negro) shadow-2xl text-sm">
        <LogoQuickgold sobreClaro width={120} />
        <hr className="mt-2 border-black/20" />

        <h2 className="mt-4 text-center text-base font-bold">TU REGALO — LOTE {contractNumber}</h2>

        <dl className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-black/60">Titular</dt>
            <dd className="font-semibold">{nombreTitular}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-black/60">Objeto</dt>
            <dd className="text-right font-semibold">Una joya sin identificar, depositada por persona desconocida</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-black/60">Entrega</dt>
            <dd className="font-semibold">El día de la comida</dd>
          </div>
        </dl>

        <p className="mt-auto pt-4 text-xs leading-relaxed text-black/70">
          En la comida, tu regalo será el paquete marcado con el <strong>lote {contractNumber}</strong>. Apúntate el
          número o haz una captura de pantalla.
        </p>
      </div>
    </div>
  );
}
