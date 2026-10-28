import { pgTable, text, integer, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
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

export const gifts = pgTable("gifts", {
  id: text("id").primaryKey(),
  receiverId: text("receiver_id").notNull().unique(),
  title: text("title").notNull(),
  photoUrl: text("photo_url"),
  createdAt: text("created_at").notNull(),
});

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    giftId: text("gift_id").notNull(),
    reviewerHash: text("reviewer_hash").notNull(),
    quilates: integer("quilates").notNull(), // 1..5
    comment: text("comment"),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    giftReviewerIdx: uniqueIndex("reviews_gift_reviewer_idx").on(t.giftId, t.reviewerHash),
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
