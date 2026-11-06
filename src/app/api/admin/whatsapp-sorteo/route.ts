import { NextResponse } from "next/server";
import { eq, like } from "drizzle-orm";
import { db } from "@/db/client";
import { config, participants } from "@/db/schema";
import { requerirAdmin } from "@/lib/contexto";
import { claveSorteo, mandarWhatsappSorteo } from "@/lib/avisos";

export const maxDuration = 60;

/** Quién tiene ya el WhatsApp del sorteo (ids). */
async function yaEnviados() {
  const filas = await db.select({ key: config.key }).from(config).where(like(config.key, claveSorteo("%")));
  return new Set(filas.map((f) => f.key));
}

export async function GET() {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;
  const enviados = await yaEnviados();
  const todos = await db.select({ id: participants.id }).from(participants);
  return NextResponse.json({ enviados: todos.filter((p) => enviados.has(claveSorteo(p.id))).map((p) => p.id) });
}

/** Manda el WhatsApp del sorteo a todo el que tenga teléfono y aún no lo tenga. */
export async function POST() {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  const [sorteoHecho] = await db.select().from(config).where(eq(config.key, "sorteo_hecho"));
  if (!sorteoHecho) {
    return NextResponse.json({ error: "Primero hay que ejecutar el sorteo." }, { status: 400 });
  }

  const enviados = await yaEnviados();
  const todos = await db.select().from(participants);
  const sinTelefono = todos.filter((p) => !p.phone).map((p) => p.name);
  const pendientes = todos.filter((p) => p.phone && !enviados.has(claveSorteo(p.id)));

  const errores: { nombre: string; error: string }[] = [];
  // De 6 en 6, como los avisos: uno detrás de otro tardaría demasiado para Vercel.
  for (let i = 0; i < pendientes.length; i += 6) {
    await Promise.all(
      pendientes.slice(i, i + 6).map(async (p) => {
        try {
          await mandarWhatsappSorteo({ ...p, phone: p.phone! });
        } catch (err) {
          errores.push({ nombre: p.name, error: err instanceof Error ? err.message : "Error desconocido." });
        }
      })
    );
  }

  return NextResponse.json({
    enviados: pendientes.length - errores.length,
    yaLoTenian: todos.length - sinTelefono.length - pendientes.length,
    sinTelefono,
    errores,
  });
}
