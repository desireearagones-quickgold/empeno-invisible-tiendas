import { NextRequest, NextResponse } from "next/server";
import { procesarAvisos } from "@/lib/avisos";

// Mandar a 36 personas puede pasar de los 10 s que da Vercel por defecto.
export const maxDuration = 60;

// Lo llama el cron de Vercel una vez al día (ver vercel.json). Vercel manda
// "Authorization: Bearer <CRON_SECRET>" él solo si esa variable existe.
export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  // En local las fechas suelen ser de prueba (con pistas ya abiertas): sin
  // esto, una llamada por error mandaría WhatsApps de verdad a los 36.
  if (process.env.VERCEL_ENV !== "production") {
    return NextResponse.json({ error: "Los avisos solo se mandan desde producción." }, { status: 403 });
  }

  return NextResponse.json({ resultados: await procesarAvisos({ enviar: true }) });
}
