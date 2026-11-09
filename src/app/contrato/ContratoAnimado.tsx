"use client";

import { useState } from "react";
import { empezarGuia } from "@/components/GuiaRecorrido";
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
  const [paso, setPaso] = useState<"cerrado" | "abriendo" | "modal">("cerrado");
  // La guía solo arranca la primera vez que se abre el sobre; al volver a
  // abrirlo con "Volver a ver" el contrato se cierra sin más.
  const [primeraVez, setPrimeraVez] = useState(!yaVisto);
  const reducida = useReducedMotion();
  const [fechaImpresion] = useState(() => new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Madrid" }));

  function abrir() {
    // Cuenta como visto al abrir el sobre, no al entrar en la página: si no,
    // quien entra y sale sin abrirlo lo encuentra ya abierto la siguiente vez.
    if (!yaVisto) fetch("/api/contrato/visto", { method: "POST" }).catch(() => {});
    if (reducida) {
      setMostrarAnimacion(false);
      if (primeraVez) {
        setPrimeraVez(false);
        empezarGuia();
      }
      return;
    }
    setPaso("abriendo");
    setTimeout(() => setPaso("modal"), 2200);
  }

  function continuar() {
    setMostrarAnimacion(false);
    setPaso("cerrado");
  }

  function volverAVer() {
    setPrimeraVez(false);
    setPaso("cerrado");
    setMostrarAnimacion(true);
  }

  const sobreAbierto = paso !== "cerrado";

  // El sobre original, tal cual era al principio (caja crema, solapa con
  // clip-path, giro de 180° y sello). Lo único nuevo es que se abre en el
  // centro y grande, en vez de en su sitio tapando el menú.
  // Pliegues del sobre. Los de arriba coinciden con el borde de la solapa
  // (le marcan el contorno cerrada) y al abrirla quedan como los pliegues
  // de dentro.
  const lineas = (
    <svg
      viewBox="0 0 288 192"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      <g fill="none" stroke="var(--color-dorado-oscuro)" strokeOpacity="0.3" strokeWidth="1.5">
        <polyline points="0,0 144,57.6 288,0" />
        <polyline points="0,192 144,104 288,192" />
      </g>
    </svg>
  );

  // La solapa tiene dos caras: la de fuera (crema) y la de dentro, algo más
  // oscura, que solo se ve cuando ha girado más de 90°. La de dentro va
  // girada 180° sobre sí misma, así que su recorte está invertido (base
  // abajo) para que al abrir quede con la punta hacia arriba.
  const flap = (
    <motion.div
      className="absolute inset-x-0 top-0 h-24 origin-top"
      style={{ transformStyle: "preserve-3d" }}
      animate={sobreAbierto ? { rotateX: 180 } : { rotateX: 0 }}
      transition={{ duration: reducida ? 0.01 : 0.8, delay: sobreAbierto ? 0.6 : 0 }}
    >
      <div
        className="absolute inset-0 bg-(--color-crema)"
        style={{ clipPath: "polygon(0 0, 50% 60%, 100% 0)", backfaceVisibility: "hidden" }}
      />
      <div
        className="absolute inset-0 bg-[#d6e0ec]"
        style={{
          clipPath: "polygon(0 100%, 50% 40%, 100% 100%)",
          backfaceVisibility: "hidden",
          transform: "rotateX(180deg)",
        }}
      />
    </motion.div>
  );

  const sello = (
    <motion.div
      className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-(--color-dorado-oscuro) text-(--color-crema) shadow-lg"
      animate={sobreAbierto ? { scale: [1, 1.3, 0], rotate: 15 } : { scale: 1 }}
      transition={{ duration: reducida ? 0.01 : 0.6, delay: sobreAbierto ? 0.8 : 0 }}
    >
      ✦
    </motion.div>
  );

  const contenido = (
    <>
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
    </>
  );

  return (
    // print:hidden a propósito: esta pantalla dice a quién regalas y NUNCA
    // debe poder imprimirse ni guardarse en PDF (solo el ticket de recogida
    // de abajo es imprimible). Ver TicketRecogida.tsx.
    <div className="h-full w-full max-w-md print:hidden">
      <AnimatePresence>
        {mostrarAnimacion && (
          <motion.div
            key="overlay"
            className={
              paso === "cerrado"
                ? "flex items-center justify-center"
                : "fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-6"
            }
            initial={false}
          >
            {paso !== "modal" ? (
              <motion.button
                onClick={paso === "cerrado" ? abrir : undefined}
                className="relative flex h-48 w-72 max-w-full items-center justify-center rounded-md bg-(--color-crema) shadow-xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: sobreAbierto ? 1.25 : 1, opacity: 1 }}
                transition={{ duration: reducida ? 0.01 : 0.5 }}
              >
                {lineas}
                {flap}
                {sello}
                {!sobreAbierto && <span className="absolute bottom-3 text-sm text-black/50">Toca para abrir</span>}
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reducida ? 0.01 : 0.4 }}
                className="documento max-h-[85vh] w-full max-w-md overflow-y-auto rounded-sm border border-black/10 bg-(--color-crema) p-6 text-(--color-negro) shadow-2xl text-sm"
              >
                {contenido}
                <div className="mt-4">
                  <button
                    onClick={() => {
                      continuar();
                      if (primeraVez) {
                        setPrimeraVez(false);
                        empezarGuia();
                      }
                    }}
                    className="w-full rounded-md bg-(--color-dorado-oscuro) py-2 text-sm font-semibold text-(--color-crema)"
                  >
                    {primeraVez ? "Siguiente: cómo sigue el juego" : "Cerrar"}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!mostrarAnimacion && (
          <motion.div
            key="contrato"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducida ? 0.01 : 0.3 }}
            className="documento flex h-full flex-col rounded-sm border border-black/10 bg-(--color-crema) p-6 text-(--color-negro) shadow-2xl text-sm"
          >
            {contenido}
            <div className="mt-auto pt-4">
              <p className="text-center text-[10px] text-black/40">
                Este encargo solo se ve en pantalla: no se imprime ni se guarda en PDF.
              </p>
              <button
                onClick={volverAVer}
                className="mt-2 w-full rounded-md border border-(--color-dorado-oscuro) py-2 text-sm font-semibold text-(--color-dorado-oscuro) hover:bg-(--color-dorado-oscuro)/10"
              >
                Volver a ver
              </button>
              <button onClick={empezarGuia} className="mt-2 w-full py-1 text-xs text-(--color-dorado-oscuro) underline">
                Ver cómo funciona el juego
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
