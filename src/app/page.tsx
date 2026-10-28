import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/auth";
import LogoQuickgold from "@/components/LogoQuickgold";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sesion = await sesionActual();
  if (sesion) redirect("/contrato");

  const { error } = await searchParams;

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-8 p-6 bg-(--color-negro) text-(--color-blanco)">
      <div className="text-center space-y-3">
        <LogoQuickgold width={120} className="mx-auto" />
        <h1 className="text-4xl font-bold">El Empeño Invisible</h1>
        <p className="text-white/60 max-w-sm mx-auto">
          No hay contraseñas ni registro aquí: entra con el enlace personal que
          te ha mandado la organización por WhatsApp.
        </p>
        {error === "enlace-invalido" && (
          <p className="text-sm text-red-400">
            Ese enlace no es válido o ha caducado. Pide que te lo reenvíen.
          </p>
        )}
      </div>
    </main>
  );
}
