import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { sesionActual, esAdmin } from "@/lib/auth";
import { calendario, resenasAbiertas, resultadosAbiertos } from "@/lib/calendario";
import NavBar from "@/components/NavBar";
import GuiaRecorrido from "@/components/GuiaRecorrido";

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
  const cal = calendario();
  const fechasGuia = {
    limites: cal.limiteFicha.map((d) => d.toISOString()),
    fichas: cal.fichas.map((d) => d.toISOString()),
    entrega: cal.entrega.toISOString(),
  };

  return (
    <html lang="es" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-(--color-fondo) text-(--color-texto)">
        {sesion && (
          <>
            <NavBar
              esAdmin={esAdmin(sesion.phone)}
              mostrarRegalos={resenasAbiertas()}
              mostrarResultados={resultadosAbiertos()}
            />
            <GuiaRecorrido fechas={fechasGuia} />
          </>
        )}
        {children}
      </body>
    </html>
  );
}
