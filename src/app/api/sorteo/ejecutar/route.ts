import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db/client";
import { participants, assignments, config } from "@/db/schema";
import { requerirAdmin } from "@/lib/contexto";
import { generarCadena } from "@/lib/sorteo";
import { encryptId, hashId, randomContractNumber } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  const ctx = await requerirAdmin();
  if ("error" in ctx) return ctx.error;

  const { confirmar } = await req.json().catch(() => ({ confirmar: false }));
  if (confirmar !== true) {
    return NextResponse.json(
      { error: "Hace falta confirmar explícitamente ({ confirmar: true}). El sorteo no se puede repetir." },
      { status: 400 }
    );
  }

  const yaHecho = db.select().from(config).where(eq(config.key, "sorteo_hecho")).get();
  if (yaHecho?.value === "true") {
    return NextResponse.json({ error: "El sorteo ya se ha ejecutado. No se puede repetir." }, { status: 409 });
  }

  const todos = db.select().from(participants).all();
  if (todos.length < 3) {
    return NextResponse.json({ error: "Hacen falta al menos 3 participantes." }, { status: 400 });
  }

  const parejas = generarCadena(todos.map((p) => p.id));
  const numerosUsados = new Set<string>();

  db.transaction((tx) => {
    for (const { giver, receiver } of parejas) {
      let contractNumber = randomContractNumber();
      while (numerosUsados.has(contractNumber)) contractNumber = randomContractNumber();
      numerosUsados.add(contractNumber);

      tx.insert(assignments)
        .values({
          id: crypto.randomUUID(),
          giverHash: hashId(giver),
          giverEnc: encryptId(giver),
          receiverHash: hashId(receiver),
          receiverEnc: encryptId(receiver),
          contractNumber,
        })
        .run();
    }

    tx.insert(config)
      .values({ key: "sorteo_hecho", value: "true" })
      .onConflictDoUpdate({ target: config.key, set: { value: "true" } })
      .run();
    tx.insert(config)
      .values({ key: "sorteo_fecha", value: new Date().toISOString() })
      .onConflictDoUpdate({ target: config.key, set: { value: new Date().toISOString() } })
      .run();
  });

  return NextResponse.json({ ok: true, parejas: parejas.length });
}
