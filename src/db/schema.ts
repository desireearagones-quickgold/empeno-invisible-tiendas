import { pgTable, text, integer, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

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

// La foto de cada regalo, aparte de `gifts` para que listar los regalos no
// arrastre las imágenes. Va en la base de datos porque en Vercel no se puede
// escribir en disco; el móvil la reduce antes de mandarla (~200 KB).
export const giftPhotos = pgTable("gift_photos", {
  giftId: text("gift_id").primaryKey(),
  mime: text("mime").notNull(),
  dataBase64: text("data_base64").notNull(),
  updatedAt: text("updated_at").notNull(),
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

// Valoraciones y respuestas a una reseña (no al regalo). A diferencia de las
// reseñas, aquí sí se sabe quién es quién: es la página de resultados, para
// después de que las reseñas ya están cerradas y no hace falta el anonimato.
export const reviewRatings = pgTable(
  "review_ratings",
  {
    id: text("id").primaryKey(),
    reviewId: text("review_id").notNull(),
    raterId: text("rater_id").notNull(),
    quilates: integer("quilates").notNull(), // 1..5
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    reviewRaterIdx: uniqueIndex("review_ratings_review_rater_idx").on(t.reviewId, t.raterId),
  })
);

export const reviewComments = pgTable("review_comments", {
  id: text("id").primaryKey(),
  reviewId: text("review_id").notNull(),
  authorId: text("author_id").notNull(),
  comment: text("comment").notNull(),
  createdAt: text("created_at").notNull(),
});

export const config = pgTable("config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  participantId: text("participant_id").notNull(),
  expiresAt: text("expires_at").notNull(),
});
