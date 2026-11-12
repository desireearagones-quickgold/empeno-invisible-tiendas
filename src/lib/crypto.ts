import crypto from "node:crypto";

/**
 * Cifrado de las parejas del sorteo. PAIRING_KEY solo existe como variable de
 * entorno (la pone IT, nunca las organizadoras). Si no está definida la app
 * no debe poder cifrar ni descifrar nada del sorteo.
 */
function pairingKey(): Buffer {
  const b64 = process.env.PAIRING_KEY;
  if (!b64) {
    throw new Error("PAIRING_KEY no está configurada. Sin ella no se puede tocar el sorteo.");
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error("PAIRING_KEY debe ser 32 bytes en base64 (AES-256).");
  }
  return key;
}

/** AES-256-GCM: IV (12 bytes) + tag (16 bytes) + texto cifrado, todo en base64. */
export function encryptId(plainId: string): string {
  const key = pairingKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainId, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptId(payload: string): string {
  const key = pairingKey();
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

/** HMAC estable de un id de participante: sirve para buscar sin descifrar nada. */
export function hashId(plainId: string): string {
  return crypto.createHmac("sha256", pairingKey()).update(plainId).digest("hex");
}

export function randomContractNumber(): string {
  return String(crypto.randomInt(0, 10000)).padStart(4, "0");
}

// Los enlaces de las tiendas empiezan por "tienda-": los botones de las
// plantillas de WhatsApp apuntan al dominio de la oficina, y la oficina
// reenvía aquí los enlaces que llevan este prefijo.
export const PREFIJO_TOKEN = "tienda-";

export function randomToken(bytes = 32): string {
  return PREFIJO_TOKEN + crypto.randomBytes(bytes).toString("base64url");
}
