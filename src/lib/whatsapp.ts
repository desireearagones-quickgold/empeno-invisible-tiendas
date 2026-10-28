const GRAPH_URL = "https://graph.facebook.com/v21.0";

type Plantilla = {
  template: string;
  lang?: string;
  /** Variables con nombre del cuerpo, ej. { enlace: "https://..." }. */
  variables?: Record<string, string>;
  /** Si la plantilla tiene un botón de URL dinámica: solo la parte que falta detrás de la URL base. */
  botonSufijo?: string;
};

/**
 * Manda un mensaje de WhatsApp vía la Cloud API de Meta. `to` en formato
 * internacional sin "+" ni espacios (ej. "34617218632").
 */
export async function enviarWhatsApp(to: string, body: Plantilla | { text: string }) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    throw new Error("Falta WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN.");
  }

  const payload =
    "template" in body
      ? {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: body.template,
            language: { code: body.lang ?? "en_US" },
            components: [
              ...(body.variables && Object.keys(body.variables).length > 0
                ? [
                    {
                      type: "body",
                      parameters: Object.entries(body.variables).map(([parameter_name, text]) => ({
                        type: "text",
                        parameter_name,
                        text,
                      })),
                    },
                  ]
                : []),
              ...(body.botonSufijo
                ? [
                    {
                      type: "button",
                      sub_type: "url",
                      index: "0",
                      parameters: [{ type: "text", text: body.botonSufijo }],
                    },
                  ]
                : []),
            ],
          },
        }
      : {
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: body.text },
        };

  const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`WhatsApp Cloud API respondió ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

/** El aviso del sorteo: manda el enlace de acceso personal de cada persona. */
export async function enviarAvisoSorteo(telefono: string, enlacePersonal: string) {
  return enviarWhatsApp(telefono, {
    template: "amigo_invisible",
    lang: "es",
    variables: { enlace: enlacePersonal },
  });
}

/**
 * Igual, pero con la plantilla mejorada (botón en vez de enlace pegado en el
 * texto). `token` es solo el trocito que falta detrás de la URL base del
 * botón (la que se puso al crear la plantilla en Meta), no la URL entera.
 */
export async function enviarAvisoSorteoConBoton(telefono: string, token: string) {
  return enviarWhatsApp(telefono, {
    template: "amigo_invisible_v2",
    lang: "es",
    botonSufijo: token,
  });
}
