/** Texto e envio do e-mail de confirmação de cadastro (fallback no Next se a API não enviar). */

export type RegistrationEmailRole = "CUSTOMER" | "SUPPLIER" | "EXECUTOR";
export type RegistrationEmailStatus = "ACTIVE" | "PENDING_ADMIN_REVIEW" | "REJECTED";

function normalizeMailFrom(raw: string | undefined): string | null {
  const v = raw?.trim();
  if (!v) return null;
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1).trim() || null;
  }
  return v;
}

function appBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.FRONTEND_URL?.split(",")[0]?.trim();
  return (raw || "http://localhost:3000").replace(/\/$/, "");
}

export function buildRegistrationConfirmationEmail(input: {
  email: string;
  name: string;
  role: RegistrationEmailRole;
  status: RegistrationEmailStatus;
}): { subject: string; text: string } {
  const site = process.env.MAIL_SITE_NAME?.trim() || "Moda Store";
  const base = appBaseUrl();
  const papel =
    input.role === "CUSTOMER"
      ? "cliente"
      : input.role === "SUPPLIER"
        ? "fornecedor"
        : "costureira";
  const aprovacao =
    input.status === "PENDING_ADMIN_REVIEW"
      ? "Nossa equipe vai analisar seus dados. Quando o cadastro for aprovado, você receberá outro e-mail e poderá usar o painel completo.\n\nEnquanto isso, já pode entrar com o mesmo e-mail e senha; algumas áreas podem ficar limitadas até a aprovação.\n\n"
      : "";
  const subject = `Cadastro confirmado — ${site}`;
  const text =
    `Olá, ${input.name},\n\n` +
    `Confirmamos que sua conta foi criada na ${site} como ${papel}.\n\n` +
    aprovacao +
    `E-mail da conta: ${input.email}\n\n` +
    `Entrar: ${base}/entrar\n` +
    (input.role === "CUSTOMER" ? `Loja: ${base}/loja\n` : "") +
    `\nSe você não fez este cadastro, ignore este e-mail ou contacte o suporte.\n`;
  return { subject, text };
}

/** Envia via API HTTP da Resend (sem dependência extra no Next). */
export async function sendRegistrationConfirmationEmail(input: {
  email: string;
  name: string;
  role: RegistrationEmailRole;
  status: RegistrationEmailStatus;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = normalizeMailFrom(process.env.MAIL_FROM);
  if (!apiKey || !from) return false;

  const { subject, text } = buildRegistrationConfirmationEmail(input);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.email],
        subject,
        text,
        html: text.replace(/\n/g, "<br/>"),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[registration-email] Resend ${res.status} para ${input.email}:`,
        body.slice(0, 500),
      );
      return false;
    }
    return true;
  } catch (e) {
    console.error("[registration-email] falha de rede:", e);
    return false;
  }
}

export function isRegistrationEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && normalizeMailFrom(process.env.MAIL_FROM));
}
