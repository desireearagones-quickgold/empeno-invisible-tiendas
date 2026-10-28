"use client";

import { useState } from "react";

const QUILATE = "◆";

export default function TarjetaRegalo({
  regalo,
}: {
  regalo: { id: string; title: string; photoUrl: string | null; receiverName: string | null };
}) {
  const [abierta, setAbierta] = useState(false);
  const [quilates, setQuilates] = useState(0);
  const [comment, setComment] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (quilates < 1) return;
    setEnviando(true);
    setMensaje(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giftId: regalo.id, quilates, comment: comment || undefined }),
    });
    const data = await res.json();
    setMensaje(res.ok ? data.mensaje : data.error);
    setEnviando(false);
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
      {regalo.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={regalo.photoUrl} alt={regalo.title} className="h-40 w-full rounded object-cover" />
      )}
      <p className="font-semibold">{regalo.title}</p>
      <p className="text-xs text-white/50">para {regalo.receiverName ?? "—"}</p>

      {!abierta ? (
        <button onClick={() => setAbierta(true)} className="text-sm text-(--color-dorado) underline">
          Escribir reseña
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-1 text-xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setQuilates(n)}
                className={n <= quilates ? "text-(--color-dorado)" : "text-white/20"}
                aria-label={`${n} quilates`}
              >
                {QUILATE}
              </button>
            ))}
          </div>
          <textarea
            maxLength={280}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comentario opcional (máx. 280 caracteres)"
            className="w-full rounded border border-white/15 bg-black/30 px-2 py-1 text-sm placeholder:text-white/30 focus:border-(--color-dorado) focus:outline-none"
          />
          <button
            onClick={enviar}
            disabled={enviando || quilates < 1}
            className="w-full rounded bg-(--color-dorado) py-1.5 text-sm font-semibold text-(--color-negro) disabled:opacity-60"
          >
            {enviando ? "Enviando…" : "Enviar reseña"}
          </button>
          {mensaje && <p className="text-xs text-white/60">{mensaje}</p>}
        </div>
      )}
    </div>
  );
}
