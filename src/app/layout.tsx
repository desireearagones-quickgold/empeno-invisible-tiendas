import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { sesionActual, esAdmin } from "@/lib/auth";
import { resenasAbiertas, cenaAbierta } from "@/lib/calendario";
import NavBar from "@/components/NavBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "El Empeño Invisible",
  description: "Amigo invisible de la oficina — sorteo, tasaciones y cena.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const sesion = await sesionActual();

  return (
    <html lang="es" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-(--color-fondo) text-(--color-texto)">
        {sesion && (
          <NavBar
            esAdmin={esAdmin(sesion.email)}
            mostrarRegalos={resenasAbiertas()}
            mostrarCena={cenaAbierta()}
          />
        )}
        {children}
      </body>
    </html>
  );
}
