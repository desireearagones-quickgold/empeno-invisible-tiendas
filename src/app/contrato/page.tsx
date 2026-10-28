import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { sesionActual } from "@/lib/auth";
import { db } from "@/db/client";
import { assignments, participants, config } from "@/db/schema";
import { hashId, decryptId } from "@/lib/crypto";
import { calendario, sorteoAbierto } from "@/lib/calendario";
import ContratoAnimado from "./ContratoAnimado";
import TicketRecogida from "./TicketRecogida";
import CuentaAtras from "@/components/CuentaAtras";

export default async function Contrato() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/");

  const cal = calendario();

  if (!sorteoAbierto()) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="text-2xl font-bold text-(--color-dorado)">Ventanilla cerrada</h1>
        <p className="max-w-sm text-white/70">
          El sorteo se abre el {cal.sorteo.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} a
          las {cal.sorteo.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}.
        </p>
        <CuentaAtras hasta={cal.sorteo.toISOString()} />
      </main>
    );
  }

  const [sorteoHecho] = await db.select().from(config).where(eq(config.key, "sorteo_hecho"));
  if (sorteoHecho?.value !== "true") {
    return (
      <main className="flex-1 flex items-center justify-center p-6 text-center text-white/70">
        <p>El sorteo todavía no se ha ejecutado. Pregunta a las organizadoras.</p>
      </main>
    );
  }

  const giverHash = hashId(sesion.id);
  const [asignacion] = await db.select().from(assignments).where(eq(assignments.giverHash, giverHash));

  if (!asignacion) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 text-center text-white/70">
        <p>No encontramos tu contrato. Avisa a las organizadoras.</p>
      </main>
    );
  }

  const receptorId = decryptId(asignacion.receiverEnc);
  const [receptor] = await db.select().from(participants).where(eq(participants.id, receptorId));

  // Mi "contrato de empeño" de verdad: el que recibo YO como destinatario de
  // otra persona. No dice quién me regala (nunca se descifra ni se consulta
  // ese dato aquí), solo mi propio lote para recoger el paquete.
  const [miTicket] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.receiverHash, hashId(sesion.id)));

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto grid max-w-md gap-8 sm:max-w-3xl sm:grid-cols-2 sm:items-stretch">
        <ContratoAnimado
          yaVisto={Boolean(asignacion.contractOpenedAt)}
          contractNumber={asignacion.contractNumber}
          nombreDepositante={sesion.name}
          nombreReceptor={receptor?.name ?? "—"}
          fechaOperacion={cal.sorteo.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
          fechaDevolucion={cal.entrega.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
        />
        {miTicket && (
          <TicketRecogida
            contractNumber={miTicket.contractNumber}
            nombreTitular={sesion.name}
            fechaRecogida={cal.entrega.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
          />
        )}
      </div>
    </main>
  );
}
