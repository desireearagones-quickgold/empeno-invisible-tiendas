import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { giftPhotos } from "@/db/schema";
import { requerirSesion } from "@/lib/contexto";

// Las fotos solo las ven los participantes (con sesión).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requerirSesion();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;
  const [foto] = await db.select().from(giftPhotos).where(eq(giftPhotos.giftId, id));
  if (!foto) return NextResponse.json({ error: "Sin foto." }, { status: 404 });

  return new NextResponse(Buffer.from(foto.dataBase64, "base64"), {
    headers: {
      "Content-Type": foto.mime,
      // La URL lleva ?v=<momento de subida>: si cambia la foto, cambia la URL.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
