"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ENLACES = [
  { href: "/contrato", label: "Contrato" },
  { href: "/mis-fichas", label: "Pistas" },
  { href: "/caja", label: "Mi caja" },
  { href: "/resenas", label: "Regalos" },
  { href: "/cena", label: "Cena" },
];

export default function NavBar({ esAdmin }: { esAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const enlaces = esAdmin ? [...ENLACES, { href: "/admin", label: "Admin" }] : ENLACES;

  return (
    <nav className="print:hidden flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-black px-3 py-2 text-sm">
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
