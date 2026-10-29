import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { sesionActual } from "@/lib/auth";
import { resenasAbiertas } from "@/lib/calendario";
import { db } from "@/db/client";
import { assignments } from "@/db/schema";
import { hashId } from "@/lib/crypto";
import Link from "next/link";
import SubirRegalo from "./SubirRegalo";
import Galeria from "./Galeria";

export default async function Resenas() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/");

  if (!resenasAbiertas()) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 text-center text-white/70">
        <p>Todavía no se han abierto los regalos. Vuelve el día de la entrega.</p>
      </main>
    );
  }

  const [miAsignacion] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.receiverHash, hashId(sesion.id)));

  return (
    <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Regalos y reseñas</h1>
        <p className="text-white/60">Las reseñas son anónimas y nadie las verá hasta que se cierren.</p>
      </div>

      {miAsignacion && (
        <div className="rounded-lg border border-(--color-dorado) bg-(--color-dorado)/10 p-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-(--color-dorado)">Busca en la ventanilla</p>
          <p className="text-2xl font-bold">Lote {miAsignacion.contractNumber}</p>
          <p className="mt-1 text-xs text-white/60">
            Tu regalo está envuelto con ese código, sin ningún nombre.
          </p>
          <Link href="/contrato" className="mt-2 inline-block text-xs text-(--color-dorado) underline">
            Imprime tu contrato de empeño para recogerlo
          </Link>
        </div>
      )}

      <SubirRegalo />
      <Galeria />
    </main>
  );
}
