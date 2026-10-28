import { NextResponse } from "next/server";
import { sesionActual, esAdmin } from "@/lib/auth";

export async function requerirSesion() {
  const participante = await sesionActual();
  if (!participante) {
    return { error: NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 }) } as const;
  }
  return { participante } as const;
}

export async function requerirAdmin() {
  const participante = await sesionActual();
  if (!participante || !esAdmin(participante.email)) {
    return { error: NextResponse.json({ error: "No tienes acceso." }, { status: 403 }) } as const;
  }
  return { participante } as const;
}
