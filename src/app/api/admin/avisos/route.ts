import { NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/contexto";
import { procesarAvisos } from "@/lib/avisos";

// Solo consulta: qué avisos hay, cuándo salen, a cuántos y cuántos se han
// mandado ya. Desde el panel no se manda nada (eso lo hace el cron).
export async function GET() {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;
  return NextResponse.json({ avisos: await procesarAvisos({ enviar: false }) });
}
