"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProximoPaso } from "@/lib/proximoPaso";

// Se pide en cada cambio de página (y no en el layout del servidor) porque
// el layout no se vuelve a pintar al navegar: la barra se quedaría diciendo
// "escribe tu pista" después de haberla escrito.
export default function BarraProximoPaso() {
  const pathname = usePathname();
  const [paso, setPaso] = useState<ProximoPaso | null>(null);

  useEffect(() => {
    let vigente = true;
    fetch("/api/proximo-paso")
      .then((r) => (r.ok ? r.json() : { paso: null }))
      .then((d) => vigente && setPaso(d.paso))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [pathname]);

  // En la propia página a la que manda el botón sobra la barra.
  if (!paso || (paso.boton && pathname === paso.boton.href)) return null;

  return (
    <div className="print:hidden border-b border-(--color-dorado)/30 bg-(--color-dorado)/10 px-4 py-2">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <p>
          <span className="font-semibold text-(--color-dorado)">Ahora te toca: </span>
          {paso.texto}
        </p>
        {paso.boton && (
          <Link
            href={paso.boton.href}
            className="shrink-0 rounded-md bg-(--color-dorado) px-3 py-1.5 font-semibold text-(--color-negro)"
          >
            {paso.boton.etiqueta}
          </Link>
        )}
      </div>
    </div>
  );
}
