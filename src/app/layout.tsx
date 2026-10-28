import type { Metadata } from "next";
import { Geist, Geist_Mono, Special_Elite } from "next/font/google";
import "./globals.css";
import { sesionActual, esAdmin } from "@/lib/auth";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const especialElite = Special_Elite({
  variable: "--font-documento",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "El Empeño Invisible",
  description: "Amigo invisible de la oficina — sorteo, tasaciones y cena.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const sesion = await sesionActual();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${especialElite.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-(--color-fondo) text-(--color-texto)">
        {sesion && <NavBar esAdmin={esAdmin(sesion.email)} />}
        {children}
      </body>
    </html>
  );
}
