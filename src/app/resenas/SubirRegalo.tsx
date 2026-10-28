"use client";

import { useState } from "react";

export default function SubirRegalo() {
  const [title, setTitle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/gifts", { method: "POST", body: form });
    setMensaje(res.ok ? "Regalo subido. Gracias por participar." : (await res.json()).error);
    setEnviando(false);
    if (res.ok) window.location.reload();
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
      <h2 className="font-semibold">Subir mi regalo</h2>
      <input
        name="title"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Taza &apos;Billete de 500 €&apos;"
        className="w-full rounded border border-white/15 bg-black/30 px-2 py-1 text-sm placeholder:text-white/30 focus:border-(--color-dorado) focus:outline-none"
      />
      <input name="photo" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" />
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded bg-(--color-dorado) py-1.5 text-sm font-semibold text-(--color-negro) disabled:opacity-60"
      >
        {enviando ? "Subiendo…" : "Guardar"}
      </button>
      {mensaje && <p className="text-xs text-white/60">{mensaje}</p>}
    </form>
  );
}
