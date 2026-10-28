"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { PuestoRanking } from "@/lib/ranking";

const QUILATE = "◆";

function Quilates({ media }: { media: number }) {
  const llenos = Math.round(media);
  return (
    <span className="text-(--color-dorado)">
      {QUILATE.repeat(llenos)}
      <span className="text-white/20">{QUILATE.repeat(5 - llenos)}</span>
      <span className="ml-2 text-white/60 text-base">{media.toFixed(1)}</span>
    </span>
  );
}

type Diapositiva =
  | { tipo: "portada" }
  | { tipo: "reseña"; regalo: PuestoRanking; texto: string }
  | { tipo: "puesto"; puesto: 3 | 2; regalo: PuestoRanking }
  | { tipo: "redoble" }
  | { tipo: "ganador"; regalo: PuestoRanking }
  | { tipo: "final" };

function barajarReseñas(ranking: PuestoRanking[]): Diapositiva[] {
  const reseñasTodas = ranking
    .flatMap((r) => r.mejoresReseñas.map((texto) => ({ regalo: r, texto })))
    .sort(() => Math.random() - 0.5)
    .slice(0, 9);

  const lista: Diapositiva[] = [{ tipo: "portada" }];
  for (const r of reseñasTodas) lista.push({ tipo: "reseña", regalo: r.regalo, texto: r.texto });
  if (ranking[2]) lista.push({ tipo: "puesto", puesto: 3, regalo: ranking[2] });
  if (ranking[1]) lista.push({ tipo: "puesto", puesto: 2, regalo: ranking[1] });
  lista.push({ tipo: "redoble" });
  if (ranking[0]) lista.push({ tipo: "ganador", regalo: ranking[0] });
  lista.push({ tipo: "final" });
  return lista;
}

export default function Presentacion({ ranking }: { ranking: PuestoRanking[] }) {
  const reducida = useReducedMotion();
  const [i, setI] = useState(0);
  // El orden es aleatorio pero solo se calcula una vez: no puede recalcularse
  // en cada render (sería impuro), así que vive en el estado inicial.
  const [diapositivas] = useState<Diapositiva[]>(() => barajarReseñas(ranking));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setI((v) => Math.min(v + 1, diapositivas.length - 1));
      }
      if (e.key === "ArrowLeft") setI((v) => Math.max(v - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [diapositivas.length]);

  const actual = diapositivas[i];

  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-black text-white p-8 text-center relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducida ? 0.01 : 0.4 }}
          className="max-w-2xl space-y-4"
        >
          {actual.tipo === "portada" && (
            <>
              <p className="uppercase tracking-[0.3em] text-(--color-dorado)">El Empeño Invisible</p>
              <h1 className="text-4xl font-bold">Resultados de la tasación</h1>
            </>
          )}
          {actual.tipo === "reseña" && (
            <>
              <p className="text-2xl documento">&ldquo;{actual.texto}&rdquo;</p>
              <p className="text-white/50">{actual.regalo.title}</p>
              <Quilates media={actual.regalo.media} />
            </>
          )}
          {actual.tipo === "puesto" && (
            <>
              <p className="text-6xl font-bold text-(--color-dorado)">{actual.puesto}º puesto</p>
              <h2 className="text-2xl font-semibold">{actual.regalo.title}</h2>
              <Quilates media={actual.regalo.media} />
              <p className="text-white/50">{actual.regalo.numReseñas} reseñas</p>
            </>
          )}
          {actual.tipo === "redoble" && (
            <motion.p
              className="text-5xl font-bold"
              animate={reducida ? {} : { scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              🥁 redoble de tambores…
            </motion.p>
          )}
          {actual.tipo === "ganador" && (
            <>
              <Confeti reducida={Boolean(reducida)} />
              <p className="text-5xl font-bold text-(--color-dorado)">🏆 1er puesto</p>
              <h2 className="text-3xl font-semibold">{actual.regalo.title}</h2>
              <Quilates media={actual.regalo.media} />
              <p className="text-white/50">
                {actual.regalo.numReseñas} reseñas · {actual.regalo.totalQuilates} quilates totales
              </p>
              <ul className="space-y-1 text-white/70 text-sm">
                {actual.regalo.mejoresReseñas.map((texto, idx) => (
                  <li key={idx}>&ldquo;{texto}&rdquo;</li>
                ))}
              </ul>
            </>
          )}
          {actual.tipo === "final" && (
            <>
              <Confeti reducida={Boolean(reducida)} />
              <h1 className="text-3xl font-bold text-(--color-dorado)">Campeón del Mundo de los Pesos Quilate</h1>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <p className="absolute bottom-4 text-xs text-white/30">
        {i + 1} / {diapositivas.length} — flecha o espacio para avanzar
      </p>
    </main>
  );
}

function Confeti({ reducida }: { reducida: boolean }) {
  const [piezas] = useState(() =>
    Array.from({ length: 40 }, () => ({
      left: Math.random() * 100,
      duracion: 2 + Math.random() * 2,
      retraso: Math.random(),
    }))
  );
  if (reducida) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {piezas.map((p, i) => (
        <motion.span
          key={i}
          className="absolute h-2 w-2 rounded-sm bg-(--color-dorado)"
          style={{ left: `${p.left}%` }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", rotate: 360 }}
          transition={{ duration: p.duracion, delay: p.retraso, repeat: Infinity }}
        />
      ))}
    </div>
  );
}
