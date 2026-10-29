"use client";

import { useState } from "react";

const LADO_MAX = 1600;

// Las fotos del móvil pesan 3-5 MB y Vercel no admite envíos de más de
// 4,5 MB, así que se reducen aquí antes de mandarlas (queda en ~200 KB).
// Pasar por canvas también convierte las HEIC del iPhone a JPEG.
async function reducir(file: File): Promise<Blob> {
  const imagen = await createImageBitmap(file, { imageOrientation: "from-image" });
  const escala = Math.min(1, LADO_MAX / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext("2d")!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();
  return new Promise((ok, mal) =>
    lienzo.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo preparar la foto."))), "image/jpeg", 0.85)
  );
}

export default function SubirRegalo({ miRegalo }: { miRegalo: { title: string; photoUrl: string | null } | null }) {
  const [title, setTitle] = useState(miRegalo?.title ?? "");
  const [foto, setFoto] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(miRegalo?.photoUrl ?? null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFoto(f);
    if (vista?.startsWith("blob:")) URL.revokeObjectURL(vista);
    setVista(f ? URL.createObjectURL(f) : null);
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);
    try {
      const form = new FormData();
      form.append("title", title);
      if (foto) form.append("photo", await reducir(foto), "regalo.jpg");
      const res = await fetch("/api/gifts", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "No se pudo subir.");
      setMensaje("Regalo subido. ¡Gracias!");
      window.location.reload();
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : "No se pudo subir. Prueba otra vez.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
      {miRegalo ? (
        <>
          <h2 className="font-semibold">✅ Tu regalo ya está subido</h2>
          <p className="text-xs text-white/60">Si quieres, puedes cambiar el nombre o la foto.</p>
        </>
      ) : (
        <>
          <h2 className="font-semibold">Sube tu regalo</h2>
          <p className="text-xs text-white/60">
            Hazle una foto ahora y ponle un nombre: así entra en el concurso al regalo más original.
          </p>
        </>
      )}
      <input
        name="title"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="¿Qué te han regalado? Ej: Taza «Billete de 500 €»"
        className="w-full rounded border border-white/15 bg-black/30 px-2 py-1 text-sm placeholder:text-white/30 focus:border-(--color-dorado) focus:outline-none"
      />
      <label className="block cursor-pointer rounded border border-dashed border-white/25 p-3 text-center text-sm text-white/70">
        {vista ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vista} alt="Tu foto" className="mx-auto max-h-56 rounded object-contain" />
        ) : (
          "📷 Hacer o elegir foto"
        )}
        <input type="file" accept="image/*" onChange={elegir} className="hidden" />
      </label>
      {vista && <p className="text-center text-xs text-white/40">Toca la foto para cambiarla</p>}
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded bg-(--color-dorado) py-1.5 text-sm font-semibold text-(--color-negro) disabled:opacity-60"
      >
        {enviando ? "Subiendo…" : miRegalo ? "Guardar cambios" : "Guardar"}
      </button>
      {mensaje && <p className="text-xs text-white/60">{mensaje}</p>}
    </form>
  );
}
