/** Texto e envio do e-mail de confirmação de cadastro (fallback no Next se a API não enviar). */

import { buildRegistrationConfirmationEmail as renderRegistrationEmail } from "@/lib/email-layout";

export type RegistrationEmailRole = "CUSTOMER" | "SUPPLIER" | "EXECUTOR";
export type RegistrationEmailStatus = "ACTIVE" | "PENDING_ADMIN_REVIEW" | "REJECTED";

function platformMailCopyBcc(to: string[]): string[] | undefined {
  const raw = process.env.MAIL_PLATFORM_COPY_TO?.trim() || "nick.tecno@gmail.com";
  const excluded = new Set(to.map((e) => e.trim().toLowerCase()));
  if (!raw || excluded.has(raw.toLowerCase())) return undefined;
  return [raw];
}

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

export function buildRegistrationConfirmationEmailContent(input: {
  email: string;
  name: string;
  role: RegistrationEmailRole;
  status: RegistrationEmailStatus;
}): { subject: string; text: string; html: string } {
  const site = process.env.MAIL_SITE_NAME?.trim() || "Moda Store";
  const base = appBaseUrl();
  const papel =
    input.role === "CUSTOMER"
      ? "cliente"
      : input.role === "SUPPLIER"
        ? "fornecedor"
        : "costureira";
  return renderRegistrationEmail({
    siteName: site,
    name: input.name,
    email: input.email,
    roleLabel: papel,
    status: input.status,
    loginUrl: `${base}/entrar`,
    shopUrl: input.role === "CUSTOMER" ? `${base}/loja` : undefined,
  });
}

/** @deprecated Use buildRegistrationConfirmationEmailContent */
export function buildRegistrationConfirmationEmail(input: {
  email: string;
  name: string;
  role: RegistrationEmailRole;
  status: RegistrationEmailStatus;
}): { subject: string; text: string } {
  const mail = buildRegistrationConfirmationEmailContent(input);
  return { subject: mail.subject, text: mail.text };
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

  const { subject, text, html } = buildRegistrationConfirmationEmailContent(input);
  const bcc = platformMailCopyBcc([input.email]);

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
        ...(bcc ? { bcc } : {}),
        subject,
        text,
        html,
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
