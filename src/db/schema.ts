import { pgTable, text, integer, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // Opcional: la lista real de participantes es solo nombre + teléfono, no
  // hay email de empresa para todo el mundo. El login nunca lo ha usado (es
  // por enlace personal), así que esto es solo informativo si se rellena.
  email: text("email").unique(),
  // Formato internacional sin "+" ni espacios (ej. "34617218632"), para
  // mandar el WhatsApp con el enlace de acceso. Puede quedar vacío si no se
  // manda por API (p. ej. se copia el enlace a mano).
  phone: text("phone"),
  // Enlace de acceso personal (se manda por WhatsApp, no hace falta email
  // real ni contraseña). Es el único "login" que existe.
  accessToken: text("access_token").notNull().unique(),
  createdAt: text("created_at").notNull(),
});

export const assignments = pgTable("assignments", {
  id: text("id").primaryKey(),
  giverHash: text("giver_hash").notNull().unique(),
  receiverEnc: text("receiver_enc").notNull(),
  receiverHash: text("receiver_hash").notNull().unique(),
  giverEnc: text("giver_enc").notNull(),
  contractNumber: text("contract_number").notNull().unique(),
  contractOpenedAt: text("contract_opened_at"),
});

export const fichas = pgTable(
  "fichas",
  {
    id: text("id").primaryKey(),
    authorHash: text("author_hash").notNull(),
    number: integer("number").notNull(), // 1..3
    fields: jsonb("fields").notNull().$type<Record<string, string>>(),
    updatedAt: text("updated_at").notNull(),
    // Cuándo la ve quien la recibe: el día siguiente de escribirla (ver
    // aperturaPista). Se fija al guardarla la primera vez y no cambia.
    abreEn: text("abre_en").notNull(),
  },
  (t) => ({
    authorNumberIdx: uniqueIndex("fichas_author_number_idx").on(t.authorHash, t.number),
  })
);

export const fichaOpens = pgTable(
  "ficha_opens",
  {
    receiverHash: text("receiver_hash").notNull(),
    number: integer("number").notNull(),
    openedAt: text("opened_at").notNull(),
  },
  (t) => ({
    pk: uniqueIndex("ficha_opens_pk").on(t.receiverHash, t.number),
  })
);

export const config = pgTable("config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  participantId: text("participant_id").notNull(),
  expiresAt: text("expires_at").notNull(),
});
