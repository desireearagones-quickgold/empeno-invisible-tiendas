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
  const estado = await Promise.all(
    numeros.map(async (n) => {
      const [existente] = await db
        .select()
        .from(fichas)
        .where(and(eq(fichas.authorHash, authorHash), eq(fichas.number, n)));
      return {
        numero: n,
        cerrada: fichaCerrada(n),
        fechaDesbloqueo: cal.fichas[n - 1].toISOString(),
        fechaLimite: cal.limiteFicha[n - 1].toISOString(),
        campos: (existente?.fields as Record<string, string>) ?? null,
      };
    })
  );

  return (
    <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Escribe pistas sobre ti</h1>
        <p className="text-white/60">
          Cada lunes, la persona a la que le regalas recibe una de estas pistas para intentar adivinar quién es su
          amigo invisible. Escríbela antes del domingo anterior. Habla de ti, no del regalo, y no pongas tu nombre,
          que nos conocemos.
        </p>
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
