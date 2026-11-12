import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { sesionActual } from "@/lib/auth";
import { db } from "@/db/client";
import { assignments, fichas, fichaOpens } from "@/db/schema";
import { hashId } from "@/lib/crypto";
import { pistaAbierta } from "@/lib/calendario";
import Compartimento from "./Compartimento";

export default async function Caja() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/");

  const receiverHash = hashId(sesion.id);
  const [miAsignacion] = await db.select().from(assignments).where(eq(assignments.receiverHash, receiverHash));

  const numeros = [1, 2, 3] as const;
  const compartimentos = await Promise.all(
    numeros.map(async (n) => {
      let campos: Record<string, string> | null = null;
      let visto = false;

      if (miAsignacion) {
        const [ficha] = await db
          .select()
          .from(fichas)
          .where(and(eq(fichas.authorHash, miAsignacion.giverHash), eq(fichas.number, n)));
        // Lo que todavía no ha llegado ni se manda al navegador.
        if (ficha && pistaAbierta(ficha.abreEn)) {
          campos = ficha.fields as Record<string, string>;
          const [open] = await db
            .select()
            .from(fichaOpens)
            .where(and(eq(fichaOpens.receiverHash, receiverHash), eq(fichaOpens.number, n)));
          visto = Boolean(open);
        }
      }

      return { numero: n, desbloqueada: campos !== null, campos, visto };
    })
  );

  return (
    <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pistas de tu amigo invisible</h1>
        <p className="text-white/60">
          Quien te regala a ti te va dejando pistas sobre quién es (no sobre el regalo), para que vayas
          adivinándolo. Cada pista llega a las 9:00 del día siguiente de escribirla, y te avisamos por WhatsApp.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {compartimentos.map((c) => (
          <Compartimento key={c.numero} {...c} />
        ))}
      </div>
    </main>
  );
}
