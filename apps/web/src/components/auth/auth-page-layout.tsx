import { OggiLogo } from "@/components/oggi-fest/oggi-logo";
import { SITE_BRAND, SITE_TAGLINE } from "@/lib/site";

type Props = {
  children: React.ReactNode;
  /** Texto de apoio no painel esquerdo (desktop). */
  quote?: string;
};

export function AuthPageLayout({
  children,
  quote = "Picolés, sorvetes e copos para montar o carrinho do seu evento. Entre para acompanhar pedidos e continuar seu Oggi Fest.",
}: Props) {
  return (
    <div className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-black p-10 text-white lg:flex">
        <OggiLogo variant="white" className="h-10 sm:h-11" priority />
        <div className="max-w-md space-y-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-[#E2007A]">{SITE_TAGLINE}</p>
          <p className="font-heading text-3xl font-black uppercase leading-tight tracking-wide text-white">
            Variedade Oggi para o seu evento
          </p>
          <p className="text-base leading-relaxed text-white/90">{quote}</p>
        </div>
        <p className="text-xs text-white/60">© {SITE_BRAND}</p>
      </div>

      <div className="flex flex-col items-center justify-center bg-oggi-pink-light/50 px-4 py-10 lg:px-12 lg:py-14">
        <div className="mb-6 flex justify-center lg:hidden">
          <OggiLogo variant="brand" className="h-9" priority />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
