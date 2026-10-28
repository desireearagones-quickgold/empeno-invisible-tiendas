# El Empeño Invisible — Especificación de la app

App web para el amigo invisible de la oficina de Grungo (~30 personas). Hace el sorteo, entrega las pistas semanales con animación, recoge reseñas anónimas de los regalos y muestra los resultados en la cena.

**Requisito principal: nadie puede saber quién regala a quién, tampoco las organizadoras ni quien administra la app.**

---

## 1. Calendario (configurable por variables)

| Hito | Fecha y hora (Europe/Madrid) | Qué hace la app |
| --- | --- | --- |
| App lista | vie 6 nov | — |
| Sorteo | lun 9 nov, 9:00 | Se ejecuta el sorteo; cada persona ve su contrato |
| Ficha 1 | lun 16 nov, 9:00 | Se desbloquea la ficha 1 para su destinatario |
| Ficha 2 | lun 23 nov, 9:00 | Se desbloquea la ficha 2 |
| Ficha 3 | lun 30 nov, 9:00 | Se desbloquea la ficha 3 |
| Límite fichas | domingo anterior a cada desbloqueo, 23:59 | Después ya no se puede editar esa ficha |
| Entrega de regalos | mié 2 dic | Se abren las fotos y las reseñas |
| Cierre de reseñas | jue 10 dic, 23:59 | No se aceptan más reseñas |
| Cena | vie 11 dic | Pantalla de resultados |

Todas las fechas se guardan en una tabla `config` o en variables de entorno, nunca escritas a mano en el código.

---

## 2. Stack recomendado

- **Framework:** Next.js (App Router) + TypeScript
- **Hosting:** Vercel (plan gratuito)
- **Base de datos:** Postgres (Neon o Supabase, plan gratuito)
- **Login:** enlace mágico por email con Auth.js (Email provider) + Resend para el envío
- **Fotos:** Vercel Blob o Supabase Storage
- **Animaciones:** Framer Motion + CSS/SVG
- **Estilos:** Tailwind con los colores corporativos de Quickgold (dorado/amarillo, negro y blanco; usar los HEX oficiales de marca)

No hace falta un backend aparte: todo va en route handlers / server actions de Next.js.

---

## 3. Anonimato (lo más importante)

### Reglas

1. **No existe ninguna pantalla, endpoint ni export que muestre las parejas.** Tampoco para admin.
2. **Las parejas se guardan cifradas** (AES-256-GCM) con una clave `PAIRING_KEY` que solo existe como variable de entorno en Vercel. La configura alguien que no juega (IT). Las organizadoras no tienen acceso al panel de Vercel ni a la base de datos.
3. **Las reseñas no guardan el email del autor.** Se guarda `reviewer_hash = HMAC(PAIRING_KEY, user_id)` para impedir duplicados y bloquear el propio regalo.
4. **Los logs no pueden imprimir IDs de parejas.** Revisar que no haya `console.log` con datos del sorteo.
5. **Los mensajes de WhatsApp son idénticos para todos**, así que quien los envía no sabe nada.

### Sorteo

- Algoritmo: barajar la lista de participantes con `crypto.getRandomValues` (Fisher-Yates) y asignar cada persona a la siguiente, cerrando el círculo (A→B→C→…→A).
- Así se garantiza que nadie se regala a sí mismo, no hay parejas cruzadas (A↔B) y todo forma una sola cadena.
- Se ejecuta **una sola vez**: un cron o una acción admin con doble confirmación que falla si ya existe un sorteo.
- Si alguien se da de baja después del sorteo: botón admin "Reparar cadena" que une a quien le regalaba con a quien iba a regalar, sin mostrar nombres. Se le avisa automáticamente por email solo a la persona afectada ("Tu prenda ha cambiado, entra a ver tu nuevo contrato").

---

## 4. Modelo de datos

```sql
participants (
  id uuid pk,
  name text,             -- nombre visible: "Juan"
  email text unique,     -- email de empresa
  created_at timestamptz
)

assignments (
  id uuid pk,
  giver_hash text unique,      -- HMAC(PAIRING_KEY, giver_id)
  receiver_enc text,           -- AES-GCM(receiver_id), con IV incluido
  receiver_hash text unique,   -- HMAC(PAIRING_KEY, receiver_id), para buscar "quién me regala" sin descifrar todo
  giver_enc text,              -- AES-GCM(giver_id)
  contract_number text         -- "0417", aleatorio de 4 cifras, único
)

fichas (
  id uuid pk,
  author_hash text,            -- HMAC del autor (quien regala)
  number int check (number between 1 and 3),
  fields jsonb,                -- ver sección 6
  updated_at timestamptz,
  unique (author_hash, number)
)

ficha_opens (                  -- para saber si el destinatario ya vio la animación
  receiver_hash text,
  number int,
  opened_at timestamptz,
  primary key (receiver_hash, number)
)

gifts (
  id uuid pk,
  receiver_id uuid unique references participants(id),  -- el regalo se identifica por quien lo recibe
  title text,                  -- "Taza 'Billete de 500 €'"
  photo_url text,
  created_at timestamptz
)

reviews (
  id uuid pk,
  gift_id uuid references gifts(id),
  reviewer_hash text,
  quilates int check (quilates between 1 and 5),
  comment text check (char_length(comment) <= 280),
  hidden boolean default false,  -- moderación
  created_at timestamptz,
  unique (gift_id, reviewer_hash)
)

config (key text pk, value text)  -- fechas, estado del sorteo, PIN de la cena
```

---

## 5. Pantallas

### 5.1 Login `/`
- Pantalla con el logo "El Empeño Invisible" y un campo de email.
- Solo pueden entrar emails que estén en `participants` (lista cerrada que carga RRHH).
- Envía un enlace mágico. Texto: *"Te hemos enviado la llave de tu caja de seguridad. Revisa tu correo."*

### 5.2 Contrato `/contrato`
- Antes del sorteo: *"El sorteo se abre el lunes 9 de noviembre a las 9:00."* con cuenta atrás.
- Después del sorteo, la primera vez: **animación del sobre lacrado** (sello dorado que se rompe, solapa que se abre, el contrato sube y se despliega). Botón "Volver a ver" para repetirla.
- Contenido del contrato:

  > **CONTRATO DE EMPEÑO Nº {contract_number}**
  > El/la depositante se compromete a custodiar la siguiente prenda hasta su devolución.
  > **Prenda depositada:** {nombre del receptor}
  > **Fecha de devolución:** 2 de diciembre
  > **Condiciones:** importe máximo de 20 €. La prenda deberá entregarse envuelta y con su certificado de autenticidad. Revelar la identidad del depositante antes de plazo supone la pérdida del contrato.

- Botón "Descargar contrato" (PNG o PDF) opcional.

### 5.3 Mis fichas `/mis-fichas` (lo que escribo yo)
- Tres tarjetas: Ficha 1 (difícil), Ficha 2 (media), Ficha 3 (fácil), con la fecha de desbloqueo de cada una.
- Estados: *Sin escribir* · *Guardada* · *Entregada* (bloqueada, ya no se edita).
- Formulario con campos fijos (sección 6) y vista previa de cómo la verá el destinatario.
- Aviso fijo: *"Habla de ti, no de tu prenda. Y no pongas tu nombre, que nos conocemos."*
- Validación suave: si algún campo contiene el nombre del autor, aviso antes de guardar.
- Recordatorio por email el sábado anterior a cada desbloqueo a quien no haya escrito la ficha: *"Tu prenda se va a quedar sin pista el lunes."*

### 5.4 Mi caja de seguridad `/caja` (lo que recibo yo)
- Panel de caja fuerte con tres compartimentos (1, 2, 3).
- Compartimento bloqueado: candado + fecha de apertura.
- Compartimento desbloqueado y no visto: brillo dorado + *"Nueva tasación"*.
- Al pulsarlo: **animación de la caja fuerte** (la rueda gira con clics, la puerta se abre, sale la ficha con un destello). Se registra en `ficha_opens`.
- Si el autor no escribió esa ficha: *"El tasador está de vacaciones. Esta semana no hay pista."*
- La ficha se muestra con estética de documento de tasación: fondo crema, sello, número de ficha, campos en tipografía mecanografiada.

### 5.5 Regalos y reseñas `/resenas` (desde el 2 dic)
- **Subir mi regalo:** quien recibe un regalo sube una foto y pone un título corto. Una vez por persona, editable.
- **Galería:** tarjetas de todos los regalos con foto, título y "para {nombre}". Sin notas ni recuentos visibles.
- **Escribir reseña:** de 1 a 5 quilates (iconos ◆, no estrellas) + comentario opcional de hasta 280 caracteres.
  - Una reseña por regalo y persona, editable hasta el cierre.
  - El regalo que has hecho tú aparece bloqueado: *"No puedes tasar tu propia pieza."* (se comprueba con `giver_hash`).
- Texto fijo: *"Las reseñas son anónimas y nadie las verá hasta la cena."*

### 5.6 Pantalla de la cena `/cena` (para proyectar)
- Protegida con PIN (`config.dinner_pin`) y disponible solo a partir del 11 dic.
- Ranking: **suma total de quilates** por regalo. Empates: gana la mayor media y, si sigue el empate, el que tenga más reseñas.
- Modo presentación a pantalla completa, se avanza con la flecha o la barra espaciadora:
  1. Portada "El Empeño Invisible — Resultados de la tasación".
  2. 8–10 diapositivas con reseñas graciosas al azar de distintos regalos (foto del regalo + reseña grande + quilates).
  3. Tercer puesto → segundo puesto → redoble → **primer puesto**: foto grande, nota media, número de reseñas, quilates totales y las 3 mejores reseñas del ganador.
  4. Pantalla final: *"Campeón del Mundo de los Pesos Quilate"* con confeti dorado.
- Ejemplo de datos para el modo demo:

| Puesto | Regalo | Nota | Reseñas | Quilates |
| --- | --- | --- | --- | --- |
| 1 | Taza "Billete de 500 €" con su cara, para Juan | ◆◆◆◆◆ 4,8 | 23 | 110 |
| 2 | Caja fuerte de juguete con pepitas de chocolate, para Marta | ◆◆◆◆◆ 4,5 | 19 | 86 |
| 3 | Báscula de bolsillo "para pesar tus excusas", para Luis | ◆◆◆◆◇ 4,1 | 17 | 70 |

### 5.7 Admin `/admin` (organizadoras)
Acceso por email en la lista `ADMIN_EMAILS`. **Las admins también juegan, así que admin no ve nada del sorteo.**

Puede:
- Cargar y editar participantes (nombre + email, importar CSV).
- Ver el estado global sin nombres: "Sorteo hecho: sí", "Fichas 1 escritas: 24/30", "Regalos con foto: 27/30", "Reseñas totales: 312".
- Ejecutar el sorteo (si no está programado) y "Reparar cadena".
- Copiar el texto del WhatsApp de cada lunes (sección 7).
- Ocultar una reseña ofensiva (ve el texto, nunca el autor).
- Activar el **modo demo** con datos falsos para enseñar la app a RRHH.

No puede:
- Ver parejas, autores de fichas ni autores de reseñas.
- Exportar la base de datos desde la app.

---

## 6. Campos de las fichas de tasación

Cada ficha tiene 4 campos de hasta 120 caracteres cada uno. Las etiquetas son fijas y el texto lo escribe el autor. Los placeholders sirven de ejemplo.

**Ficha 1 (difícil)**
- Pieza — *compañera de oficina*
- Quilataje — *18k de paciencia, 6k de puntualidad*
- Marcas de uso — *se le da fatal perder en los juegos de mesa*
- Valor de reventa — *bajo antes del primer café*

**Ficha 2 (media)**
- Peso — *el justo, y subiendo con los polvorones*
- Estado — *usada, pero funcional*
- Origen — *ha pasado por tres ciudades antes de llegar a esta oficina*
- Observaciones del tasador — *libre*

**Ficha 3 (fácil)**
- Ubicación habitual — *zona ventana, segunda mesa*
- Accesorio característico — *auriculares naranjas*
- Ruido que emite — *teclea muy fuerte cuando tiene prisa*
- Última pista — *libre*

---

## 7. Avisos por WhatsApp

No hay integración con la API de WhatsApp. Los avisos se mandan a mano desde una **lista de difusión** (mensajes individuales, cada uno en su chat privado). Como el texto es igual para todos, quien lo envía no sabe nada.

La pantalla admin muestra el texto listo para copiar:

- **Sorteo (9 nov):** *"Se ha abierto la ventanilla de El Empeño Invisible. Entra y descubre tu contrato: {URL}"*
- **Fichas (16, 23 y 30 nov):** *"Tienes una nueva tasación en tu caja de seguridad: {URL}/caja"*
- **Recordatorio fichas (sábados):** *"Último aviso: tu prenda se queda sin pista el lunes si no escribes tu ficha. {URL}/mis-fichas"*
- **Reseñas (2 dic):** *"Ya puedes tasar los regalos. Reseñas anónimas hasta el 10 de diciembre: {URL}/resenas"*

Requisito para que llegue: cada participante tiene que tener guardado el número de quien envía.

---

## 8. Certificado de autenticidad (opcional)

Página `/certificado` donde quien regala escribe dos líneas y descarga un PDF A6 con diseño de certificado (marco dorado, sello, "Pieza única") para imprimirlo y meterlo dentro del regalo. No se guarda en la base de datos, se genera en el navegador.

---

## 9. Textos y tono

- Tono de humor de tienda de compraventa: contratos, tasaciones, quilates, ventanilla, cámara acorazada. Gracioso, nada corporativo.
- Todo en español de España.
- Microcopys clave:
  - Error de login: *"Este email no está en el registro de depositantes."*
  - Ficha guardada: *"Tasación archivada. Nadie sospecha nada."*
  - Reseña enviada: *"Tasación registrada. Tu secreto está a salvo en la cámara acorazada."*

---

## 10. Diseño y animaciones

- Mobile first: casi todo el mundo entrará desde el WhatsApp del móvil.
- Paleta: colores corporativos de Quickgold + crema para los documentos.
- Tipografías: una sans de marca para la interfaz y una mecanografiada (p. ej. *Courier Prime* o *Special Elite*) para contratos y fichas.
- Animaciones (Framer Motion), entre 1,5 y 3 s, siempre con botón "Saltar":
  - **Sobre lacrado** (contrato): el sello se agrieta, la solapa se abre y el papel sube.
  - **Caja fuerte** (fichas): la rueda gira (sonido de clic opcional, silenciado por defecto), la puerta se abre y sale la ficha.
  - **Confeti dorado** en el ganador de la cena.
- Respetar `prefers-reduced-motion`: en ese caso, fundido simple.

---

## 11. Seguridad y privacidad

- Sesiones con cookie httpOnly y enlaces mágicos que caducan a los 15 min.
- Todas las comprobaciones de fecha y permisos se hacen en el servidor, nunca solo en el cliente.
- Una persona solo puede leer: su contrato, sus fichas escritas y las fichas desbloqueadas que le corresponden.
- Rate limit en login y en el envío de reseñas.
- Después de la cena (p. ej. 15 ene) se borran `assignments`, `fichas` y `reviews`. Botón admin "Cerrar edición" con confirmación.
- Los teléfonos de WhatsApp **no se guardan en la app**.

---

## 12. Criterios de aceptación

- [ ] Con 30 participantes de prueba, el sorteo genera un único ciclo sin autoasignaciones ni parejas cruzadas (test automático con 1.000 ejecuciones).
- [ ] Ningún endpoint devuelve el par giver/receiver en claro (revisar todas las respuestas JSON).
- [ ] Una cuenta admin que también juega solo ve su propio contrato.
- [ ] Una ficha no se puede leer antes de su fecha aunque se llame a la API directamente.
- [ ] Una ficha no se puede editar después de su fecha límite.
- [ ] No se puede reseñar el regalo propio ni reseñar dos veces el mismo regalo.
- [ ] `/cena` no muestra resultados antes del 11 dic ni sin PIN.
- [ ] Las animaciones funcionan en iPhone (Safari) y Android (Chrome) y se pueden saltar.
- [ ] El modo demo funciona sin tocar los datos reales.

---

## 13. Fuera de alcance

- Envío automático de WhatsApp (requeriría la API de WhatsApp Business).
- Registrar en la app quién acierta a su amigo invisible (se hace en directo el 2 dic).
- Chat entre participantes.

---

## 14. Plan de trabajo (2 semanas)

| Días | Tarea |
| --- | --- |
| 1–2 | Proyecto Next.js, base de datos, login por email, carga de participantes |
| 3–4 | Sorteo cifrado + contrato + animación del sobre |
| 5–6 | Mis fichas + caja de seguridad + animación de la caja fuerte |
| 7–8 | Regalos, fotos y reseñas |
| 9 | Pantalla de la cena + modo demo |
| 10 | Pruebas en móvil, revisión de anonimato, despliegue por IT |
