"use client";

import { useEffect, useState } from "react";

function partes(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    dias: Math.floor(total / 86400),
    horas: Math.floor((total % 86400) / 3600),
    minutos: Math.floor((total % 3600) / 60),
    segundos: total % 60,
  };
}

export default function CuentaAtras({ hasta }: { hasta: string }) {
  const objetivo = new Date(hasta).getTime();
  const [restante, setRestante] = useState(() => partes(objetivo - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setRestante(partes(objetivo - Date.now())), 1000);
    return () => clearInterval(id);
  }, [objetivo]);

  return (
    <div className="flex gap-4 font-mono text-2xl text-(--color-dorado)">
      <span>{restante.dias}d</span>
      <span>{restante.horas}h</span>
      <span>{restante.minutos}m</span>
      <span>{restante.segundos}s</span>
    </div>
  );
}
