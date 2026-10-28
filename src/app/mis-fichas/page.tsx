import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { sesionActual } from "@/lib/auth";
import { db } from "@/db/client";
import { fichas } from "@/db/schema";
import { hashId } from "@/lib/crypto";
import { calendario, fichaCerrada } from "@/lib/calendario";
import TarjetaFicha from "./TarjetaFicha";

export default async function MisFichas() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/");

  const cal = calendario();
  const authorHash = hashId(sesion.id);

  const numeros = [1, 2, 3] as const;
  const estado = numeros.map((n) => {
    const existente = db
      .select()
      .from(fichas)
      .where(and(eq(fichas.authorHash, authorHash), eq(fichas.number, n)))
      .get();
    return {
      numero: n,
      cerrada: fichaCerrada(n),
      fechaDesbloqueo: cal.fichas[n - 1].toISOString(),
      fechaLimite: cal.limiteFicha[n - 1].toISOString(),
      campos: (existente?.fields as Record<string, string>) ?? null,
    };
  });

  return (
    <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pistas</h1>
        <p className="text-white/60">Habla de ti, no de tu joya. Y no pongas tu nombre, que nos conocemos.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {estado.map((f) => (
          <TarjetaFicha
            key={f.numero}
            numero={f.numero}
            cerrada={f.cerrada}
            fechaLimite={f.fechaLimite}
            camposGuardados={f.campos}
            nombrePropio={sesion.name}
          />
        ))}
      </div>
    </main>
  );
}
