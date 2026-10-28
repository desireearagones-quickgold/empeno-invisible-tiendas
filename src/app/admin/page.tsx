import { redirect } from "next/navigation";
import { sesionActual, esAdmin } from "@/lib/auth";
import { calendario } from "@/lib/calendario";
import AdminPanel from "./AdminPanel";

export default async function Admin() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/");
  if (!esAdmin(sesion.phone)) redirect("/contrato");

  const cal = calendario();
  const url = process.env.APP_URL ?? "";

  const textos = {
    fichas: `Tienes una nueva tasación en tu caja de seguridad: ${url}/caja`,
    recordatorio: `Último aviso: tu joya se queda sin pista el lunes si no escribes tu ficha. ${url}/mis-fichas`,
    resenas: `Ya puedes tasar los regalos. Reseñas anónimas hasta el ${cal.cierreResenas.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}: ${url}/resenas`,
  };

  return <AdminPanel textos={textos} />;
}
