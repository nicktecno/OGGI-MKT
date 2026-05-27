/**
 * Layout HTML para e-mails transacionais (inline CSS, compatível com clientes comuns).
 * Paleta alinhada ao tema editorial do site (papel quente, tinta profunda, bronze).
 */

export const EMAIL_THEME = {
  pageBg: '#f5f1ea',
  cardBg: '#fffcf7',
  ink: '#1c1a22',
  muted: '#5c5668',
  accent: '#8f7344',
  accentLight: '#c4a574',
  border: '#e5dfd4',
  buttonBg: '#1c1a22',
  buttonText: '#faf8f5',
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type TransactionalEmailCta = { label: string; href: string };

export type WrapTransactionalEmailInput = {
  siteName: string;
  preheader?: string;
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  cta?: TransactionalEmailCta;
  secondaryCta?: TransactionalEmailCta;
  footerHtml?: string;
};

function ctaButton(cta: TransactionalEmailCta, variant: 'primary' | 'secondary'): string {
  const isPrimary = variant === 'primary';
  const bg = isPrimary ? EMAIL_THEME.buttonBg : 'transparent';
  const color = isPrimary ? EMAIL_THEME.buttonText : EMAIL_THEME.ink;
  const border = isPrimary ? EMAIL_THEME.buttonBg : EMAIL_THEME.border;
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:${isPrimary ? '8px 0 0' : '12px 0 0'};">
      <tr>
        <td style="border-radius:10px;background:${bg};border:1px solid ${border};">
          <a href="${escapeHtml(cta.href)}" target="_blank" rel="noopener noreferrer"
            style="display:inline-block;padding:14px 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:500;color:${color};text-decoration:none;line-height:1.2;">
            ${escapeHtml(cta.label)}
          </a>
        </td>
      </tr>
    </table>`;
}

/** Envelope HTML com cabeçalho e rodapé da marca. */
export function wrapTransactionalEmail(input: WrapTransactionalEmailInput): string {
  const site = escapeHtml(input.siteName);
  const preheader = input.preheader ? escapeHtml(input.preheader) : escapeHtml(input.title);
  const eyebrow = input.eyebrow ? escapeHtml(input.eyebrow) : site.toUpperCase();
  const title = escapeHtml(input.title);
  const footer =
    input.footerHtml ??
    `<p style="margin:0;font-size:12px;line-height:1.6;color:${EMAIL_THEME.muted};">
      Você recebeu este e-mail porque há uma conta ou ação vinculada à ${site}.
      Se não reconhece, pode ignorar com segurança.
    </p>`;

  const ctas = [
    input.cta ? ctaButton(input.cta, 'primary') : '',
    input.secondaryCta ? ctaButton(input.secondaryCta, 'secondary') : '',
  ].join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_THEME.pageBg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    ${preheader}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${EMAIL_THEME.pageBg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
          <tr>
            <td style="padding:0 0 20px;text-align:center;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${EMAIL_THEME.accent};">
                ${eyebrow}
              </p>
              <h1 style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:500;line-height:1.2;color:${EMAIL_THEME.ink};">
                ${site}
              </h1>
              <div style="margin:16px auto 0;width:48px;height:1px;background:linear-gradient(90deg,transparent,${EMAIL_THEME.accentLight},transparent);"></div>
            </td>
          </tr>
          <tr>
            <td style="background:${EMAIL_THEME.cardBg};border:1px solid ${EMAIL_THEME.border};border-radius:16px;padding:32px 28px;box-shadow:0 1px 2px rgba(28,26,34,0.04);">
              <h2 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:500;line-height:1.35;color:${EMAIL_THEME.ink};">
                ${title}
              </h2>
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:${EMAIL_THEME.ink};">
                ${input.bodyHtml}
              </div>
              ${ctas}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0;text-align:center;">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function paragraphsFromText(text: string): string {
  const blocks = text
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);
  const pStyle = `margin:0 0 16px;font-size:15px;line-height:1.65;color:${EMAIL_THEME.ink};`;
  return blocks
    .map((block) => {
      const lines = block.split('\n').map((l) => escapeHtml(l.trim())).filter(Boolean);
      return `<p style="${pStyle}">${lines.join('<br/>')}</p>`;
    })
    .join('');
}

export function buildRegistrationConfirmationEmail(input: {
  siteName: string;
  name: string;
  email: string;
  roleLabel: string;
  status: 'ACTIVE' | 'PENDING_ADMIN_REVIEW' | 'REJECTED';
  loginUrl: string;
  shopUrl?: string;
}): { subject: string; text: string; html: string } {
  const site = input.siteName;
  const aprovacao =
    input.status === 'PENDING_ADMIN_REVIEW'
      ? 'Nossa equipe vai analisar seus dados. Quando o cadastro for aprovado, você receberá outro e-mail e poderá usar o painel completo.\n\nEnquanto isso, já pode entrar com o mesmo e-mail e senha; algumas áreas podem ficar limitadas até a aprovação.\n\n'
      : '';
  const subject = `Cadastro confirmado — ${site}`;
  const text =
    `Olá, ${input.name},\n\n` +
    `Confirmamos que sua conta foi criada na ${site} como ${input.roleLabel}.\n\n` +
    aprovacao +
    `E-mail da conta: ${input.email}\n\n` +
    `Entrar: ${input.loginUrl}\n` +
    (input.shopUrl ? `Loja: ${input.shopUrl}\n` : '') +
    `\nSe você não fez este cadastro, ignore este e-mail ou contacte o suporte.\n`;

  const bodyHtml =
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${EMAIL_THEME.ink};">Olá, <strong>${escapeHtml(input.name)}</strong>,</p>` +
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${EMAIL_THEME.ink};">Confirmamos que sua conta foi criada na <strong>${escapeHtml(site)}</strong> como <strong>${escapeHtml(input.roleLabel)}</strong>.</p>` +
    (aprovacao
      ? `<p style="margin:0 0 16px;padding:14px 16px;background:${EMAIL_THEME.pageBg};border-left:3px solid ${EMAIL_THEME.accent};border-radius:0 8px 8px 0;font-size:14px;line-height:1.6;color:${EMAIL_THEME.muted};">${escapeHtml(aprovacao.trim())}</p>`
      : '') +
    `<p style="margin:0 0 4px;font-size:13px;color:${EMAIL_THEME.muted};">E-mail da conta</p>` +
    `<p style="margin:0 0 16px;font-family:ui-monospace,Menlo,monospace;font-size:14px;color:${EMAIL_THEME.ink};">${escapeHtml(input.email)}</p>`;

  const html = wrapTransactionalEmail({
    siteName: site,
    preheader: `Sua conta na ${site} foi criada com sucesso.`,
    title: 'Cadastro confirmado',
    bodyHtml,
    cta: { label: 'Entrar na conta', href: input.loginUrl },
    secondaryCta: input.shopUrl ? { label: 'Visitar a loja', href: input.shopUrl } : undefined,
    footerHtml: `<p style="margin:0;font-size:12px;line-height:1.6;color:${EMAIL_THEME.muted};">Se você não fez este cadastro, ignore este e-mail ou contacte o suporte da ${escapeHtml(site)}.</p>`,
  });

  return { subject, text, html };
}

export function buildPasswordResetEmail(input: {
  siteName: string;
  name: string;
  resetUrl: string;
  loginUrl: string;
}): { subject: string; text: string; html: string } {
  const subject = 'Redefinir sua senha';
  const text =
    `Olá, ${input.name},\n\n` +
    `Recebemos um pedido para redefinir a senha da sua conta. Se foi você, use o link abaixo (válido por tempo limitado):\n\n` +
    `${input.resetUrl}\n\n` +
    `Se você não pediu, ignore este e-mail; sua senha permanece a mesma.\n\n` +
    `Entrar: ${input.loginUrl}\n`;

  const bodyHtml =
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${EMAIL_THEME.ink};">Olá, <strong>${escapeHtml(input.name)}</strong>,</p>` +
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${EMAIL_THEME.ink};">Recebemos um pedido para redefinir a senha da sua conta. Se foi você, use o botão abaixo (o link expira em breve).</p>` +
    `<p style="margin:0;font-size:14px;line-height:1.6;color:${EMAIL_THEME.muted};">Se você não pediu, ignore este e-mail — sua senha permanece a mesma.</p>`;

  const html = wrapTransactionalEmail({
    siteName: input.siteName,
    preheader: 'Link para criar uma nova senha.',
    title: 'Redefinir senha',
    bodyHtml,
    cta: { label: 'Criar nova senha', href: input.resetUrl },
    footerHtml: `<p style="margin:0;font-size:12px;line-height:1.6;color:${EMAIL_THEME.muted};">Por segurança, este link é de uso único e expira após um tempo.</p>`,
  });

  return { subject, text, html };
}

export function buildAccountApprovedEmail(input: {
  siteName: string;
  name: string;
  roleLabel: string;
  loginUrl: string;
  panelUrl: string;
}): { subject: string; text: string; html: string } {
  const subject = `Cadastro aprovado — ${input.roleLabel}`;
  const text =
    `Olá, ${input.name},\n\n` +
    `Seu cadastro como ${input.roleLabel} na plataforma foi aprovado. Já pode aceder ao painel completo.\n\n` +
    `Entrar: ${input.loginUrl}\n` +
    `Painel: ${input.panelUrl}\n`;

  const bodyHtml =
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${EMAIL_THEME.ink};">Olá, <strong>${escapeHtml(input.name)}</strong>,</p>` +
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${EMAIL_THEME.ink};">Seu cadastro como <strong>${escapeHtml(input.roleLabel)}</strong> foi <strong style="color:${EMAIL_THEME.accent};">aprovado</strong>. Você já pode usar o painel completo.</p>`;

  const html = wrapTransactionalEmail({
    siteName: input.siteName,
    preheader: 'Seu cadastro foi aprovado.',
    title: 'Cadastro aprovado',
    bodyHtml,
    cta: { label: 'Abrir painel', href: input.panelUrl },
    secondaryCta: { label: 'Entrar', href: input.loginUrl },
  });

  return { subject, text, html };
}

export function buildAccountRejectedEmail(input: {
  siteName: string;
  name: string;
  roleLabel: string;
  reason: string;
  homeUrl: string;
}): { subject: string; text: string; html: string } {
  const subject = `Cadastro não aprovado — ${input.roleLabel}`;
  const text =
    `Olá, ${input.name},\n\n` +
    `Seu cadastro como ${input.roleLabel} não foi aprovado neste momento.\n\n` +
    `Motivo: ${input.reason}\n\n` +
    `Em caso de dúvida, responda a este e-mail ou contacte o suporte da loja.\n\n` +
    `Página inicial: ${input.homeUrl}\n`;

  const bodyHtml =
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${EMAIL_THEME.ink};">Olá, <strong>${escapeHtml(input.name)}</strong>,</p>` +
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${EMAIL_THEME.ink};">Seu cadastro como ${escapeHtml(input.roleLabel)} não foi aprovado neste momento.</p>` +
    `<p style="margin:0 0 4px;font-size:13px;color:${EMAIL_THEME.muted};">Motivo informado</p>` +
    `<p style="margin:0 0 16px;padding:14px 16px;background:${EMAIL_THEME.pageBg};border-radius:8px;font-size:14px;line-height:1.6;color:${EMAIL_THEME.ink};">${escapeHtml(input.reason)}</p>` +
    `<p style="margin:0;font-size:14px;line-height:1.6;color:${EMAIL_THEME.muted};">Em caso de dúvida, responda a este e-mail ou contacte o suporte.</p>`;

  const html = wrapTransactionalEmail({
    siteName: input.siteName,
    preheader: 'Atualização sobre seu cadastro.',
    title: 'Cadastro não aprovado',
    bodyHtml,
    cta: { label: 'Ir ao site', href: input.homeUrl },
  });

  return { subject, text, html };
}

/** E-mails internos/admin: mesmo visual, sem CTA obrigatório. */
export function buildPlainNotificationEmail(input: {
  siteName: string;
  title: string;
  text: string;
}): { html: string } {
  const html = wrapTransactionalEmail({
    siteName: input.siteName,
    preheader: input.title,
    title: input.title,
    bodyHtml: paragraphsFromText(input.text),
  });
  return { html };
}
