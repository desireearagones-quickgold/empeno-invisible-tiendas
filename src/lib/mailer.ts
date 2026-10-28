/**
 * Solo se usa para el aviso excepcional de "reparar cadena" (ver
 * /api/sorteo/reparar-cadena). El login de verdad no pasa por email: es el
 * enlace personal de participants.accessToken, mandado por WhatsApp.
 * Si no hay RESEND_API_KEY, el aviso se imprime por consola.
 */
export async function enviarAviso(email: string, asunto: string, mensajeHtml: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n[mailer-mock] "${asunto}" para ${email}:\n  ${mensajeHtml}\n`);
    return;
  }

  const from = process.env.RESEND_FROM ?? "El Empeño Invisible <no-reply@quickgold.es>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: email, subject: asunto, html: mensajeHtml }),
  });

  if (!res.ok) {
    throw new Error(`Resend respondió ${res.status}: ${await res.text()}`);
  }
}
