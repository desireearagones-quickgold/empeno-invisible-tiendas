import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assignments, participants } from "@/db/schema";
import { requerirAdmin } from "@/lib/contexto";
import { decryptId, hashId } from "@/lib/crypto";
import { enviarAviso } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  const { participantId } = await req.json().catch(() => ({}));
  if (!participantId) {
    return NextResponse.json({ error: "Falta participantId." }, { status: 400 });
  }

  const hash = hashId(participantId);
  const entrante = db.select().from(assignments).where(eq(assignments.receiverHash, hash)).get(); // X -> saliente
  const saliente = db.select().from(assignments).where(eq(assignments.giverHash, hash)).get(); // saliente -> Y

  if (!entrante || !saliente) {
    return NextResponse.json({ error: "Ese participante no tiene pareja asignada." }, { status: 404 });
  }

  // X ahora regala a Y. No hace falta descifrar ni X ni Y: reutilizamos los
  // bloques cifrados que ya existían de cada uno.
  db.transaction((tx) => {
    // Primero se borra la fila saliente: si no, el receiver_hash que vamos a
    // reasignar a "entrante" todavía estaría ocupado por ella (UNIQUE).
    tx.delete(assignments).where(eq(assignments.id, saliente.id)).run();
    tx.update(assignments)
      .set({ receiverHash: saliente.receiverHash, receiverEnc: saliente.receiverEnc })
      .where(eq(assignments.id, entrante.id))
      .run();
  });

  // Avisamos solo a X (su contrato / joya ha cambiado).
  const xId = decryptId(entrante.giverEnc);
  const x = db.select().from(participants).where(eq(participants.id, xId)).get();
  if (x) {
    const url = `${process.env.APP_URL}/contrato`;
    await enviarAviso(
      x.email,
      "Tu joya ha cambiado",
      `<p>Tu joya ha cambiado, entra a ver tu nuevo contrato.</p><p><a href="${url}">${url}</a></p>`
    );
  }

  return NextResponse.json({ ok: true });
}
