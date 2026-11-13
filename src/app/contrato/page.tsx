import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { sesionActual, esAdmin } from "@/lib/auth";
import { db } from "@/db/client";
import { assignments, participants, config } from "@/db/schema";
import { hashId, decryptId } from "@/lib/crypto";
import ContratoAnimado from "./ContratoAnimado";
import TicketRecogida from "./TicketRecogida";

export default async function Contrato() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/");

  const [sorteoHecho] = await db.select().from(config).where(eq(config.key, "sorteo_hecho"));
  if (sorteoHecho?.value !== "true") {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold text-(--color-dorado)">Todavía no hay sorteo</h1>
        <p className="max-w-sm text-white/70">
          Cuando se haga te llegará un WhatsApp. Mientras, ya puedes ir escribiendo tus pistas.
        </p>
      </main>
    );
  }

  const giverHash = hashId(sesion.id);
  const [asignacion] = await db.select().from(assignments).where(eq(assignments.giverHash, giverHash));

  if (!asignacion && esAdmin(sesion.phone)) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-2xl font-bold text-(--color-dorado)">Eres la organizadora</h1>
        <p className="max-w-sm text-white/70">No entras en el sorteo de las tiendas, así que no tienes contrato. Todo lo tuyo está en el panel.</p>
        <a href="/admin" className="rounded bg-(--color-dorado) px-4 py-2 text-sm font-semibold text-black">Ir al panel</a>
      </main>
    );
  }

  if (!asignacion) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 text-center text-white/70">
        <p>No encontramos tu contrato. Avisa a la organización.</p>
      </main>
    );
  }

  const receptorId = decryptId(asignacion.receiverEnc);
  const [receptor] = await db.select().from(participants).where(eq(participants.id, receptorId));
  const [fechaSorteo] = await db.select().from(config).where(eq(config.key, "sorteo_fecha"));

  // Mi propio lote como destinatario de otra persona: el número que llevará
  // escrito el paquete que me toca en la cena. Nunca dice quién me regala.
  const [miTicket] = await db.select().from(assignments).where(eq(assignments.receiverHash, hashId(sesion.id)));

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto grid max-w-md gap-8 sm:max-w-3xl sm:grid-cols-2 sm:items-stretch">
        <ContratoAnimado
          yaVisto={Boolean(asignacion.contractOpenedAt)}
          contractNumber={asignacion.contractNumber}
          nombreDepositante={sesion.name}
          nombreReceptor={receptor?.name ?? "—"}
          fechaOperacion={
            fechaSorteo
              ? new Date(fechaSorteo.value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid" })
              : "—"
          }
          fechaDevolucion="El día de la cena"
        />
        {miTicket && <TicketRecogida contractNumber={miTicket.contractNumber} nombreTitular={sesion.name} />}
      </div>
    </main>
  );
}
