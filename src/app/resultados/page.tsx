import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/auth";
import { resultadosAbiertos } from "@/lib/calendario";
import { calcularRanking, reseñasDeRegalo } from "@/lib/ranking";
import { detalleReseña } from "@/lib/resultados";
import ReseñaInteractiva from "./ReseñaInteractiva";

export default async function Resultados() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/");

  if (!resultadosAbiertos()) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 text-center text-white/70">
        <p>Todavía no se han abierto los resultados. Vuelve cuando se cierren las reseñas.</p>
      </main>
    );
  }

  const ranking = await calcularRanking();
  const ganador = ranking[0];

  if (!ganador || ganador.numReseñas === 0) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 text-center text-white/70">
        <p>Todavía no hay reseñas suficientes para saber quién gana.</p>
      </main>
    );
  }

  const reseñas = await reseñasDeRegalo(ganador.giftId);
  const detalles = await Promise.all(reseñas.map((r) => detalleReseña(r.id, sesion.id)));

  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-8">
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-(--color-dorado)">Campeón del Mundo de los Pesos Quilate</p>
        <h1 className="text-2xl font-bold">{ganador.title}</h1>
        <p className="text-white/60">Lo recibió {ganador.receiverName ?? "—"}</p>
        {ganador.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ganador.photoUrl} alt={ganador.title} className="mx-auto h-56 rounded object-cover" />
        )}
        <p className="text-white/70">
          {ganador.media.toFixed(1)} ◆ de media · {ganador.numReseñas} reseñas · {ganador.totalQuilates} quilates totales
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Todas las reseñas</h2>
        {reseñas.map((r, i) => (
          <ReseñaInteractiva key={r.id} reseña={r} detalle={detalles[i]} />
        ))}
      </div>
    </main>
  );
}
