import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

type SendMode = 'resend' | 'smtp' | 'none';

/** Remove aspas extras que às vezes vêm do painel do Render/Vercel. */
function normalizeMailFrom(raw: string | undefined): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1).trim() || undefined;
  }
  return v;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly mode: SendMode;
  private readonly resend: Resend | null;
  private readonly transporter: nodemailer.Transporter | null;

  constructor() {
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (resendKey) {
      this.mode = 'resend';
      this.resend = new Resend(resendKey);
      this.transporter = null;
      return;
    }
    const host = process.env.SMTP_HOST?.trim();
    if (host) {
      this.mode = 'smtp';
      this.resend = null;
      const port = Number(process.env.SMTP_PORT) || 587;
      const user = process.env.SMTP_USER?.trim();
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true',
        auth: user ? { user, pass: process.env.SMTP_PASS ?? '' } : undefined,
      });
      return;
    }
    this.mode = 'none';
    this.resend = null;
    this.transporter = null;
  }

  /** Há transporte (Resend ou SMTP) e remetente configurados. */
  isConfigured(): boolean {
    return Boolean(this.mode !== 'none' && normalizeMailFrom(process.env.MAIL_FROM));
  }

  async send(params: {
    to: string | string[];
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    const from = normalizeMailFrom(process.env.MAIL_FROM);
    const toList = Array.isArray(params.to) ? params.to : [params.to];
    const toLabel = toList.join(', ');
    const html = params.html ?? params.text.replace(/\n/g, '<br/>');

    if (!from || this.mode === 'none') {
      this.logger.warn(
        `E-mail não enviado (configure Resend ou SMTP e o remetente no servidor): "${params.subject}" → ${toLabel}`,
      );
      return;
    }

    if (this.mode === 'resend' && this.resend) {
      const { error } = await this.resend.emails.send({
        from,
        to: toList,
        subject: params.subject,
        text: params.text,
        html,
      });
      if (error) {
        const hint =
          error.message?.includes('domain') || error.message?.includes('verify')
            ? ' Verifique o domínio em resend.com/domains e use MAIL_FROM com e-mail desse domínio.'
            : '';
        this.logger.error(`Resend: ${error.message}${hint}`, JSON.stringify(error));
        throw new Error(error.message);
      }
      return;
    }

    if (this.mode === 'smtp' && this.transporter) {
      await this.transporter.sendMail({
        from,
        to: toList.join(', '),
        subject: params.subject,
        text: params.text,
        html,
      });
      return;
    }

    this.logger.warn(`E-mail não enviado (transporte inválido): "${params.subject}" → ${toLabel}`);
  }
}
