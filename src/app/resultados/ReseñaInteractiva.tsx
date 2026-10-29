"use client";

import { useState } from "react";
import type { ReseñaPublica } from "@/lib/ranking";
import type { DetalleReseña } from "@/lib/resultados";

const QUILATE = "◆";

export default function ReseñaInteractiva({ reseña, detalle }: { reseña: ReseñaPublica; detalle: DetalleReseña }) {
  const [miValoracion, setMiValoracion] = useState(detalle.miValoracion);
  const [media, setMedia] = useState(detalle.mediaValoracion);
  const [num, setNum] = useState(detalle.numValoraciones);
  const [comentarios, setComentarios] = useState(detalle.comentarios);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function votar(q: number) {
    const anterior = miValoracion;
    setMiValoracion(q);
    const res = await fetch(`/api/resultados/${reseña.id}/valorar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quilates: q }),
    });
    if (!res.ok) {
      setMiValoracion(anterior);
      return;
    }
    // Recalcula la media en local sin pedirla otra vez al servidor.
    if (anterior == null) {
      setMedia((media * num + q) / (num + 1));
      setNum(num + 1);
    } else {
      setMedia((media * num - anterior + q) / num);
    }
  }

  async function comentar() {
    if (!nuevoComentario.trim()) return;
    setEnviando(true);
    const res = await fetch(`/api/resultados/${reseña.id}/comentar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: nuevoComentario }),
    });
    if (res.ok) {
      setComentarios((c) => [...c, { id: crypto.randomUUID(), authorName: "Tú", comment: nuevoComentario, createdAt: new Date().toISOString() }]);
      setNuevoComentario("");
    }
    setEnviando(false);
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-(--color-dorado)">{QUILATE.repeat(reseña.quilates)}</span>
        <span className="text-xs text-white/60">{reseña.autor ?? "—"}</span>
      </div>
      {reseña.comment && <p className="text-sm">&ldquo;{reseña.comment}&rdquo;</p>}

      <div className="flex items-center gap-2 text-xs text-white/60">
        <span>Valora esta reseña:</span>
        <div className="flex gap-0.5 text-base">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => votar(n)}
              className={n <= (miValoracion ?? 0) ? "text-(--color-dorado)" : "text-white/20"}
              aria-label={`${n} quilates`}
            >
              {QUILATE}
            </button>
          ))}
        </div>
        {num > 0 && <span>({media.toFixed(1)} de {num})</span>}
      </div>

      {comentarios.length > 0 && (
        <ul className="space-y-1 border-t border-white/10 pt-2 text-sm">
          {comentarios.map((c) => (
            <li key={c.id}>
              <span className="font-semibold text-(--color-dorado)">{c.authorName}:</span> {c.comment}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value.slice(0, 280))}
          placeholder="Responde a esta reseña…"
          className="flex-1 rounded border border-white/15 bg-black/30 px-2 py-1 text-sm placeholder:text-white/30 focus:border-(--color-dorado) focus:outline-none"
        />
        <button
          onClick={comentar}
          disabled={enviando || !nuevoComentario.trim()}
          className="rounded bg-(--color-dorado) px-3 py-1 text-sm font-semibold text-(--color-negro) disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
