"use client";

import { useEffect, useState } from "react";
import TarjetaRegalo from "./TarjetaRegalo";

type Regalo = { id: string; title: string; photoUrl: string | null; receiverId: string; receiverName: string | null };

export default function Galeria() {
  const [regalos, setRegalos] = useState<Regalo[] | null>(null);

  useEffect(() => {
    fetch("/api/gifts")
      .then((r) => r.json())
      .then((d) => setRegalos(d.gifts));
  }, []);

  if (!regalos) return <p className="text-white/50">Cargando galería…</p>;
  if (regalos.length === 0) return <p className="text-white/50">Todavía no hay regalos subidos.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {regalos.map((r) => (
        <TarjetaRegalo key={r.id} regalo={r} />
      ))}
    </div>
  );
}
