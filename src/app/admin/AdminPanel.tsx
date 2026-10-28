"use client";

import { useEffect, useState } from "react";
import type { PuestoRanking } from "@/lib/ranking";

type Estado = {
  totalParticipantes: number;
  sorteoHecho: boolean;
  totalAsignaciones: number;
  fichasPorNumero: number[];
  regalosConFoto: number;
  reseñasTotales: number;
};

type Participante = { id: string; name: string; email: string | null; phone: string | null; accessToken: string };
type Reseña = { id: string; comment: string | null; quilates: number; hidden: boolean; giftTitle: string | null };

export default function AdminPanel({ textos }: { textos: Record<string, string> }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [participantes, setParticipantes] = useState<Participante[] | null>(null);
  const [reseñas, setReseñas] = useState<Reseña[] | null>(null);
  const [ranking, setRanking] = useState<PuestoRanking[] | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);

  function recargar() {
    fetch("/api/admin/estado").then((r) => r.json()).then(setEstado);
    fetch("/api/admin/participants").then((r) => r.json()).then((d) => setParticipantes(d.participants));
    fetch("/api/admin/reviews").then((r) => r.json()).then((d) => setReseñas(d.reviews));
    fetch("/api/admin/ranking").then((r) => r.json()).then((d) => setRanking(d.ranking));
  }

  useEffect(recargar, []);

  async function añadirParticipante(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nombre, email, phone: telefono }),
    });
    setNombre("");
    setEmail("");
    setTelefono("");
    recargar();
  }

  async function mandarWhatsapp(id: string) {
    const res = await fetch(`/api/admin/participants/${id}/whatsapp`, { method: "POST" });
    const data = await res.json();
    setMensaje(res.ok ? "WhatsApp enviado." : data.error);
  }

  async function importarCsv(file: File) {
    const form = new FormData();
    form.append("csv", file);
    const res = await fetch("/api/admin/participants", { method: "POST", body: form });
    const data = await res.json();
    setMensaje(res.ok ? `Importados ${data.añadidos} participantes.` : data.error);
    recargar();
  }

  async function borrarParticipante(id: string) {
    const res = await fetch(`/api/admin/participants?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) setMensaje(data.error);
    recargar();
  }

  async function ejecutarSorteo() {
    if (!window.confirm("¿Seguro? El sorteo solo se puede ejecutar una vez.")) return;
    if (!window.confirm("De verdad, de verdad: ¿ejecutar el sorteo ahora?")) return;
    const res = await fetch("/api/sorteo/ejecutar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmar: true }),
    });
    const data = await res.json();
    setMensaje(res.ok ? `Sorteo hecho: ${data.parejas} parejas.` : data.error);
    recargar();
  }

  async function repararCadena(id: string) {
    if (!window.confirm("¿Reparar la cadena para este participante que se da de baja?")) return;
    const res = await fetch("/api/sorteo/reparar-cadena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: id }),
    });
    const data = await res.json();
    setMensaje(res.ok ? "Cadena reparada." : data.error);
    recargar();
  }

  async function ocultarReseña(id: string, hidden: boolean) {
    await fetch(`/api/admin/reviews/${id}/ocultar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden }),
    });
    recargar();
  }

  function copiar(texto: string) {
    navigator.clipboard.writeText(texto).then(() => setMensaje("Copiado."));
  }

  function enlaceAcceso(token: string) {
    return `${window.location.origin}/api/acceso/${token}`;
  }

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Ventanilla de administración</h1>
        <p className="text-white/60 text-sm">
          No ves ni parejas, ni autores de fichas, ni autores de reseñas. Tú también juegas.
        </p>
        {mensaje && <p className="mt-2 text-sm text-(--color-dorado)">{mensaje}</p>}
      </div>

      <section className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
        <h2 className="font-semibold">Estado global</h2>
        {estado ? (
          <ul className="text-sm text-white/70 space-y-1">
            <li>Participantes: {estado.totalParticipantes}</li>
            <li>Sorteo hecho: {estado.sorteoHecho ? "sí" : "no"} ({estado.totalAsignaciones} parejas)</li>
            <li>
              Fichas escritas: 1→{estado.fichasPorNumero[0]} · 2→{estado.fichasPorNumero[1]} · 3→
              {estado.fichasPorNumero[2]} (de {estado.totalParticipantes})
            </li>
            <li>Regalos con foto: {estado.regalosConFoto}/{estado.totalParticipantes}</li>
            <li>Reseñas totales: {estado.reseñasTotales}</li>
          </ul>
        ) : (
          <p className="text-white/50 text-sm">Cargando…</p>
        )}
      </section>

      <section className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
        <h2 className="font-semibold">Sorteo</h2>
        <button
          onClick={ejecutarSorteo}
          disabled={estado?.sorteoHecho}
          className="rounded bg-(--color-dorado) px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
        >
          {estado?.sorteoHecho ? "Sorteo ya ejecutado" : "Ejecutar sorteo"}
        </button>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
        <h2 className="font-semibold">Participantes</h2>
        <p className="text-xs text-white/50">
          No hay email ni contraseña: cada persona entra con su enlace personal, que le mandas por WhatsApp
          la primera vez (el día del sorteo). Después, el navegador recuerda quién es durante dos meses.
        </p>
        <form onSubmit={añadirParticipante} className="flex gap-2 flex-wrap">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="rounded border border-white/15 bg-black/30 px-2 py-1 text-sm"
          />
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="617218632"
            className="rounded border border-white/15 bg-black/30 px-2 py-1 text-sm"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email (opcional)"
            className="rounded border border-white/15 bg-black/30 px-2 py-1 text-sm"
          />
          <button type="submit" className="rounded bg-(--color-dorado) px-3 py-1 text-sm font-semibold text-black">
            Añadir
          </button>
        </form>
        <p className="text-xs text-white/40">
          El CSV admite <code>nombre,telefono</code> o, si hace falta email, <code>nombre,email,telefono</code>
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && importarCsv(e.target.files[0])}
          className="text-xs text-white/60"
        />
        <ul className="max-h-80 overflow-y-auto divide-y divide-white/5 text-sm">
          {participantes?.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 py-1.5">
              <span className="truncate">
                {p.name} <span className="text-white/40">({p.phone ?? "sin teléfono"})</span>
              </span>
              <span className="flex shrink-0 gap-2">
                <button
                  onClick={() => copiar(enlaceAcceso(p.accessToken))}
                  className="text-xs text-(--color-dorado) underline"
                >
                  Copiar enlace
                </button>
                {p.phone && (
                  <button onClick={() => mandarWhatsapp(p.id)} className="text-xs text-(--color-dorado) underline">
                    Mandar WhatsApp
                  </button>
                )}
                {estado?.sorteoHecho && (
                  <button onClick={() => repararCadena(p.id)} className="text-xs text-(--color-dorado) underline">
                    Reparar cadena
                  </button>
                )}
                <button onClick={() => borrarParticipante(p.id)} className="text-xs text-red-400 underline">
                  Borrar
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
        <h2 className="font-semibold">Textos de WhatsApp</h2>
        {Object.entries(textos).map(([clave, texto]) => (
          <div key={clave} className="flex items-start justify-between gap-2 text-sm">
            <p className="text-white/70">{texto}</p>
            <button onClick={() => copiar(texto)} className="shrink-0 rounded bg-white/10 px-2 py-1 text-xs">
              Copiar
            </button>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
        <h2 className="font-semibold">Moderación de reseñas</h2>
        <ul className="divide-y divide-white/5 text-sm">
          {reseñas?.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-1">
              <span className={r.hidden ? "line-through text-white/40" : "text-white/70"}>
                {r.giftTitle}: {"◆".repeat(r.quilates)} {r.comment}
              </span>
              <button onClick={() => ocultarReseña(r.id, !r.hidden)} className="text-xs text-(--color-dorado) underline shrink-0">
                {r.hidden ? "Mostrar" : "Ocultar"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
        <h2 className="font-semibold">Resultado de la votación</h2>
        <p className="text-xs text-white/50">
          Solo lo ves tú aquí. Gana el regalo con más quilates en total; empates por nota media y luego por
          nº de reseñas.
        </p>
        {ranking && ranking.length === 0 && <p className="text-white/50 text-sm">Todavía no hay reseñas.</p>}
        <ol className="divide-y divide-white/5 text-sm">
          {ranking?.map((r, i) => (
            <li key={r.giftId} className="flex items-center justify-between gap-2 py-2">
              <span>
                <span className="text-(--color-dorado) font-semibold">{i + 1}.</span> {r.title}
                <span className="text-white/40"> (para {r.receiverName ?? "—"})</span>
              </span>
              <span className="shrink-0 text-white/70">
                {r.media.toFixed(1)} ◆ · {r.numReseñas} reseñas · {r.totalQuilates} quilates
              </span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
