import { NextRequest } from "next/server";
import { entrarYRedirigir } from "@/lib/acceso";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return entrarYRedirigir(req, token, "/contrato");
}
