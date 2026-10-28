import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { participants, sessions } from "@/db/schema";
import { randomToken } from "@/lib/crypto";

const COOKIE_NAME = "empeno_session";
const SESION_DIAS = 60; // cubre todo el calendario (sorteo → cena) con margen

/**
 * El único "login" que existe: el enlace personal de cada participante
 * (participants.accessToken), que las organizadoras le mandan por WhatsApp.
 * No hay email ni contraseña. El token es largo, aleatorio y NO caduca ni se
 * gasta con el uso: si alguien pierde la sesión, solo tiene que volver a
 * pulsar el mismo enlace guardado en su WhatsApp.
 */
export async function accederConToken(token: string): Promise<boolean> {
  const [participante] = await db.select().from(participants).where(eq(participants.accessToken, token));
  if (!participante) return false;

  const sessionToken = randomToken();
  const expiresAt = new Date(Date.now() + SESION_DIAS * 86_400_000).toISOString();
  await db.insert(sessions).values({ token: sessionToken, participantId: participante.id, expiresAt });

  const jar = await cookies();
  jar.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  return true;
}

export async function sesionActual() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [sesion] = await db.select().from(sessions).where(eq(sessions.token, token));
  if (!sesion || new Date(sesion.expiresAt).getTime() < Date.now()) return null;

  const [participante] = await db
    .select()
    .from(participants)
    .where(eq(participants.id, sesion.participantId));
  return participante ?? null;
}

export async function cerrarSesion() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  jar.delete(COOKIE_NAME);
}

/** Identifica a las admins por teléfono (en vez de email: la lista real de
 * participantes no trae email, solo nombre y teléfono). Acepta el teléfono
 * en cualquier formato, lo compara ya limpio de espacios/símbolos. */
export function esAdmin(phone: string | null): boolean {
  if (!phone) return false;
  const limpio = phone.replace(/[^0-9]/g, "");
  const admins = (process.env.ADMIN_PHONES ?? "")
    .split(",")
    .map((p) => p.replace(/[^0-9]/g, ""))
    .filter(Boolean);
  return admins.some((a) => limpio.endsWith(a) || a.endsWith(limpio));
}
