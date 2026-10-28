import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/auth";
import PinGate from "./PinGate";

export default async function Cena() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/");

  return <PinGate />;
}
