"use client";

import LogoQuickgold from "@/components/LogoQuickgold";

/**
 * El "Contrato de empeño" de verdad: el que imprime quien RECIBE un regalo,
 * para presentarlo en la ventanilla y recogerlo. A propósito nunca dice quién
 * lo deposita — ese dato ni siquiera se consulta al construir esta pantalla.
 */
export default function TicketRecogida({
  contractNumber,
  nombreTitular,
  fechaRecogida,
}: {
  contractNumber: string;
  nombreTitular: string;
  fechaRecogida: string;
}) {
  return (
    <div className="h-full w-full max-w-md">
      <div className="documento flex h-full flex-col rounded-sm border border-black/10 bg-(--color-crema) p-6 text-(--color-negro) shadow-2xl text-sm">
        <LogoQuickgold sobreClaro width={120} />
        <hr className="mt-2 border-black/20" />

        <h2 className="mt-4 text-center text-base font-bold">CONTRATO DE EMPEÑO — LOTE {contractNumber}</h2>

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
            <dt className="text-black/60">Recogida</dt>
            <dd className="font-semibold">{fechaRecogida}, en ventanilla</dd>
          </div>
        </dl>

        <div className="mt-auto pt-4">
          <p className="text-xs leading-relaxed text-black/70">
            <strong>Condiciones:</strong> imprescindible presentar este contrato, impreso o en la pantalla del móvil, para recoger el paquete.
            Sin contrato no hay joya.
          </p>

          <div className="print:hidden mt-6">
            <button
              onClick={() => window.print()}
              className="w-full rounded-md bg-(--color-dorado-oscuro) py-2 text-sm font-semibold text-(--color-crema) hover:opacity-90"
            >
              Imprimir / Guardar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
