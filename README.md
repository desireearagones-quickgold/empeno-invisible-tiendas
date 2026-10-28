# El Empeño Invisible

Amigo invisible de la oficina de Grungo: sorteo cifrado, fichas semanales
animadas, regalos y reseñas anónimas, y pantalla de resultados para la cena.
Ver `empeno-invisible-app.md` para la especificación completa.

**Nadie puede saber quién regala a quién, tampoco las organizadoras ni quien
administra la app.** Ver sección "Anonimato" de la especificación.

## Arrancar en local

```bash
npm install
cp .env.example .env.local   # y genera PAIRING_KEY / AUTH_SECRET (ver abajo)
npm run db:push              # crea las tablas en ./data/empeno.sqlite3
npm run db:seed              # 30 participantes de prueba + la dueña del proyecto
npm run dev
```

Abre http://localhost:3000. Como no hay cuenta de Resend configurada, los
enlaces mágicos de login se imprimen por consola (`[mailer-mock]`) en vez de
enviarse por email.

Generar `PAIRING_KEY` y `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Comprobaciones

```bash
npm run test:sorteo   # 1.000 sorteos de 30 personas: sin autoasignaciones ni cruces
npm run lint
npm run build
```

## Stack

Next.js (App Router) + TypeScript, Tailwind, Drizzle ORM sobre SQLite en
local (pensado para pasar a Postgres/Neon o Supabase en producción sin tocar
las consultas), Framer Motion para las animaciones, sesiones por cookie
httpOnly con enlace mágico (sustituye a Auth.js + Resend mientras no hay
cuentas reales; el envío real se activa solo con `RESEND_API_KEY`).

## Dónde está cada cosa

- `src/lib/crypto.ts` + `src/lib/sorteo.ts` — el núcleo del anonimato: cifrado
  AES-256-GCM de las parejas y el sorteo en cadena (Fisher-Yates).
- `src/lib/calendario.ts` — todas las fechas vienen de variables de entorno
  (`.env.example`), nunca escritas a mano en el código.
- `src/db/schema.ts` — el modelo de datos (sección 4 de la especificación).
- `src/app/*` — una carpeta por pantalla (`contrato`, `mis-fichas`, `caja`,
  `resenas`, `cena`, `admin`, `certificado`).

## Pendiente antes de producción

- Los colores de `src/app/globals.css` (`--color-dorado` etc.) están tomados
  a ojo de una captura pequeña del logo. Confirmar el HEX exacto si hay un
  manual de marca con los valores oficiales.
- Pasar `DATABASE_URL` a Postgres (Neon/Supabase) y `RESEND_API_KEY` real;
  las consultas usan Drizzle y el cambio de dialecto es contenido en
  `src/db/schema.ts` y `src/db/client.ts`.
- IT debe generar y guardar `PAIRING_KEY` y `AUTH_SECRET` definitivos en
  Vercel; las organizadoras no deben tener acceso a esas variables.
- Cargar la lista real de participantes desde `/admin` (CSV: `name,email`).
