"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function NavBar({
  esAdmin,
  mostrarRegalos,
}: {
  esAdmin: boolean;
  mostrarRegalos: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const enlaces = [
    { href: "/contrato", label: "Contrato" },
    { href: "/mis-fichas", label: "Pistas" },
    { href: "/caja", label: "Mi caja" },
    // No tiene sentido enseñar estos enlaces antes de que haya nada que ver
    // ahí: solo confunde (la gente los pulsa y se encuentra un "cerrado").
    ...(mostrarRegalos || esAdmin ? [{ href: "/resenas", label: "Regalos" }] : []),
    ...(esAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <nav className="print:hidden flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-(--color-negro) px-3 py-2 text-sm">
      {enlaces.map((e) => (
        <Link
          key={e.href}
          href={e.href}
          className={
            "shrink-0 rounded px-3 py-1 " +
            (pathname === e.href ? "bg-(--color-dorado) text-black font-semibold" : "text-white/70 hover:text-white")
          }
        >
          {e.label}
        </Link>
      ))}
      <button onClick={salir} className="ml-auto shrink-0 rounded px-3 py-1 text-white/50 hover:text-white">
        Salir
      </button>
    </nav>
  );
}
