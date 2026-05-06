import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contato/contact-form";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fale conosco",
  description: `Entre em contacto com a equipa ${SITE_NAME}.`,
  robots: { index: true, follow: true },
};

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 lg:px-10">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Início
        </Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground">Fale conosco</span>
      </nav>

      <header className="mt-8 space-y-3 border-b border-border/60 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Contacto</p>
        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">Fale conosco</h1>
        <p className="max-w-xl text-pretty text-muted-foreground leading-relaxed">
          Dúvidas sobre encomendas, parcerias ou a loja? Envie uma mensagem — a nossa equipa recebe por e-mail e
          responde o quanto antes.
        </p>
      </header>

      <div className="mt-10">
        <ContactForm />
      </div>
    </div>
  );
}
