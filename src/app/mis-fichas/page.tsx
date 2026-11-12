import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { sesionActual } from "@/lib/auth";
import { db } from "@/db/client";
import { fichas } from "@/db/schema";
import { hashId } from "@/lib/crypto";
import { pistaAbierta } from "@/lib/calendario";
import TarjetaFicha from "./TarjetaFicha";

export default async function MisFichas() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/");

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
        abreEn: existente?.abreEn ?? null,
        entregada: existente ? pistaAbierta(existente.abreEn) : false,
        campos: (existente?.fields as Record<string, string>) ?? null,
      };
    })
  );

  return (
    <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Escribe pistas sobre ti</h1>
        <p className="text-white/60">
          Cada pista le llega a la persona a la que regalas a las 9:00 del día siguiente de guardarla (así, aunque
          esté a tu lado, no sabrá que la acabas de escribir tú). Escríbelas cuando quieras, de una en una o todas
          a la vez, y hasta que le llegue puedes corregirla. Habla de ti, no del regalo, y no pongas tu nombre.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {estado.map((f) => (
          <TarjetaFicha
            key={f.numero}
            numero={f.numero}
            entregada={f.entregada}
            abreEn={f.abreEn}
            camposGuardados={f.campos}
            nombrePropio={sesion.name}
          />
        ))}
      </div>
    </main>
  );
}
