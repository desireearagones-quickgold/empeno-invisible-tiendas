import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Toda la app depende de la sesión (cookies) y de la base de datos en
     cada petición: no hay nada que merezca la pena cachear como página
     estática, así que se desactiva el renderizado estático por defecto. */

  // Para poder probar desde el móvil en local, abriendo la IP de la red
  // (ver README). Sin esto, Next.js bloquea su propio recargado en caliente
  // y la página se comporta rara (el formulario parece "recargarse" solo).
  allowedDevOrigins: ["192.168.0.160", "10.168.168.22"],

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
