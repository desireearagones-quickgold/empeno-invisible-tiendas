import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { sesionActual } from "@/lib/auth";
import { db } from "@/db/client";
import { assignments, fichas, fichaOpens } from "@/db/schema";
import { hashId } from "@/lib/crypto";
import { calendario, fichaDesbloqueada } from "@/lib/calendario";
import Compartimento from "./Compartimento";

export default async function Caja() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/");

  const cal = calendario();
  const receiverHash = hashId(sesion.id);
  const [miAsignacion] = await db.select().from(assignments).where(eq(assignments.receiverHash, receiverHash));

  const numeros = [1, 2, 3] as const;
  const compartimentos = await Promise.all(
    numeros.map(async (n) => {
      const desbloqueada = fichaDesbloqueada(n);
      let camposGuardados: Record<string, string> | null = null;
      let visto = false;

      if (desbloqueada && miAsignacion) {
        const [ficha] = await db
          .select()
          .from(fichas)
          .where(and(eq(fichas.authorHash, miAsignacion.giverHash), eq(fichas.number, n)));
        camposGuardados = (ficha?.fields as Record<string, string>) ?? null;

        const [open] = await db
          .select()
          .from(fichaOpens)
          .where(and(eq(fichaOpens.receiverHash, receiverHash), eq(fichaOpens.number, n)));
        visto = Boolean(open);
      }

      return {
        numero: n,
        desbloqueada,
        fechaDesbloqueo: cal.fichas[n - 1].toISOString(),
        hayFicha: camposGuardados !== null,
        campos: camposGuardados,
        visto,
      };
    })
  );

  return (
    <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pistas de tu amigo invisible</h1>
        <p className="text-white/60">
          Quien te ha tocado a ti va dejando pistas sobre sí mismo (no sobre el regalo), una cada semana, para que
          vayas adivinando quién es.
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
