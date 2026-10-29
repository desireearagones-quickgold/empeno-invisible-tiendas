import { redirect } from "next/navigation";
import { sesionActual, esAdmin } from "@/lib/auth";
import AdminPanel from "./AdminPanel";

export default async function Admin() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/");
  if (!esAdmin(sesion.phone)) redirect("/contrato");

  return <AdminPanel />;
}
