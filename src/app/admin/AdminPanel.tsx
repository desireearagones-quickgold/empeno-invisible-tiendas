"use client";

import { useEffect, useState } from "react";
import type { ResultadoAviso } from "@/lib/avisos";

type Estado = {
  totalParticipantes: number;
  sorteoHecho: boolean;
  totalAsignaciones: number;
  fichasPorNumero: number[];
};

type Participante = { id: string; name: string; email: string | null; phone: string | null; accessToken: string };

export default function AdminPanel() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [avisos, setAvisos] = useState<ResultadoAviso[] | null>(null);
  const [participantes, setParticipantes] = useState<Participante[] | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [conWhatsapp, setConWhatsapp] = useState<Set<string>>(new Set());
  const [mandandoTodos, setMandandoTodos] = useState(false);
  // Confirmación dentro de la página: window.confirm no sale en el navegador
  // de WhatsApp/Teams ni si Chrome tiene bloqueados los diálogos, y entonces
  // el botón no hacía nada sin decir por qué.
  const [confirmando, setConfirmando] = useState<"sorteo" | "todos" | null>(null);
  const [ejecutando, setEjecutando] = useState(false);

  /** fetch que nunca falla en silencio: si algo va mal, lo dice en el mensaje. */
  async function pedir(url: string, init?: RequestInit) {
    try {
      const res = await fetch(url, init);
      const data = await res.json().catch(() => ({ error: `El servidor respondió ${res.status} sin explicación.` }));
      return { ok: res.ok, data };
    } catch (err) {
      return { ok: false, data: { error: `No se pudo conectar: ${err instanceof Error ? err.message : err}` } };
    }
  }

  function recargar() {
    fetch("/api/admin/whatsapp-sorteo").then((r) => r.json()).then((d) => setConWhatsapp(new Set(d.enviados)));
    fetch("/api/admin/estado").then((r) => r.json()).then(setEstado);
    fetch("/api/admin/participants").then((r) => r.json()).then((d) => setParticipantes(d.participants));
    fetch("/api/admin/avisos").then((r) => r.json()).then((d) => setAvisos(d.avisos));
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
    recargar();
  }

  async function mandarWhatsappATodos() {
    setConfirmando(null);
    setMandandoTodos(true);
    setMensaje("Mandando… no cierres esta página.");
    const { ok, data } = await pedir("/api/admin/whatsapp-sorteo", { method: "POST" });
    setMandandoTodos(false);
    if (!ok) {
      setMensaje(data.error);
    } else {
      const partes = [`Enviados: ${data.enviados}.`];
      if (data.yaLoTenian) partes.push(`Ya lo tenían: ${data.yaLoTenian}.`);
      if (data.sinTelefono.length) partes.push(`Sin teléfono: ${data.sinTelefono.join(", ")}.`);
      if (data.errores.length) {
        partes.push(`Fallaron ${data.errores.length}: ${data.errores.map((e: { nombre: string }) => e.nombre).join(", ")}. Vuelve a pulsar para reintentar solo esos.`);
      }
      setMensaje(partes.join(" "));
    }
    recargar();
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
    setConfirmando(null);
    setEjecutando(true);
    setMensaje("Haciendo el sorteo…");
    const { ok, data } = await pedir("/api/sorteo/ejecutar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmar: true }),
    });
    setEjecutando(false);
    setMensaje(ok ? `Sorteo hecho: ${data.parejas} parejas.` : data.error);
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

  function copiar(texto: string) {
    navigator.clipboard.writeText(texto).then(() => setMensaje("Copiado."));
  }

  function enlaceAcceso(token: string) {
    return `${window.location.origin}/api/acceso/${token}`;
  }

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Administración · Tiendas</h1>
        <p className="text-white/60 text-sm">
          No ves ni parejas ni quién escribe cada pista.
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
              Pistas escritas: 1→{estado.fichasPorNumero[0]} · 2→{estado.fichasPorNumero[1]} · 3→
              {estado.fichasPorNumero[2]} (de {estado.totalParticipantes})
            </li>
          </ul>
        ) : (
          <p className="text-white/50 text-sm">Cargando…</p>
        )}
      </section>

      <section className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
        <h2 className="font-semibold">Sorteo</h2>
        {confirmando === "sorteo" ? (
          <div className="space-y-2 rounded border border-(--color-dorado) p-3">
            <p className="text-sm">¿Seguro? El sorteo solo se puede hacer una vez ({estado?.totalParticipantes ?? "…"} personas).</p>
            <div className="flex gap-2">
              <button onClick={ejecutarSorteo} className="rounded bg-(--color-dorado) px-4 py-2 text-sm font-semibold text-black">
                Sí, hacer el sorteo
              </button>
              <button onClick={() => setConfirmando(null)} className="rounded border border-white/20 px-4 py-2 text-sm">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmando("sorteo")}
            disabled={estado?.sorteoHecho || ejecutando}
            className="rounded bg-(--color-dorado) px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
          >
            {estado?.sorteoHecho ? "Sorteo ya ejecutado" : ejecutando ? "Haciendo el sorteo…" : "Ejecutar sorteo"}
          </button>
        )}
        {estado?.sorteoHecho && (
          <div className="space-y-1">
            {confirmando === "todos" ? (
              <div className="space-y-2 rounded border border-(--color-dorado) p-3">
                <p className="text-sm">
                  ¿Mandar el WhatsApp del sorteo a{" "}
                  {(participantes ?? []).filter((p) => p.phone && !conWhatsapp.has(p.id)).length} personas?
                </p>
                <div className="flex gap-2">
                  <button onClick={mandarWhatsappATodos} className="rounded bg-(--color-dorado) px-4 py-2 text-sm font-semibold text-black">
                    Sí, mandar
                  </button>
                  <button onClick={() => setConfirmando(null)} className="rounded border border-white/20 px-4 py-2 text-sm">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmando("todos")}
                disabled={mandandoTodos}
                className="rounded bg-(--color-dorado) px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
              >
                {mandandoTodos ? "Mandando…" : "Mandar WhatsApp a todos"}
              </button>
            )}
            <p className="text-xs text-white/50">
              Lo tienen {conWhatsapp.size} de {participantes?.length ?? 0}. Se salta a quien ya lo tiene, así que se
              puede volver a pulsar sin repetir mensajes.
            </p>
          </div>
        )}
        {mensaje && <p className="text-sm text-(--color-dorado)">{mensaje}</p>}
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
                {conWhatsapp.has(p.id) && <span className="ml-1 text-xs text-green-400">✓ enviado</span>}
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
        <h2 className="font-semibold">Avisos de pista nueva por WhatsApp</h2>
        <p className="text-xs text-white/50">
          Cada pista le llega a quien la recibe a las 9:00 del día siguiente de escribirla, y a las 9:15 se le avisa por
          WhatsApp con un botón que la lleva directa a sus pistas. Salen solos, no hay que hacer nada.
        </p>
        <ul className="divide-y divide-white/5 text-sm">
          {avisos?.map((a) => (
            <li key={a.id} className="py-2">
              <span className="text-white/80">{a.titulo}</span>
              <p className="text-xs text-white/50">
                {a.destinatarios === 0
                  ? "Todavía no le ha llegado a nadie"
                  : `Le ha llegado a ${a.destinatarios} · avisadas ${a.enviados}${a.pendientes ? ` · ${a.pendientes} se avisarán a las 9:15` : ""}`}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
