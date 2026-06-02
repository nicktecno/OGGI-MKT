import Image from "next/image";
import Link from "next/link";
import { OGGI_LOGO } from "@/lib/oggi-fest/brand";
import { cn } from "@/lib/utils";

type Props = {
  /** `brand` = rosa no fundo claro; `white` = branco no fundo rosa/escuro */
  variant?: "brand" | "white";
  className?: string;
  /** Envolve em link para a home */
  href?: string;
  priority?: boolean;
};

const LOGO = {
  brand: { src: OGGI_LOGO.brand, width: 534, height: 233 },
  white: { src: OGGI_LOGO.white, width: 534, height: 233 },
} as const;

export function OggiLogo({ variant = "brand", className, href = "/", priority }: Props) {
  const { src, width, height } = LOGO[variant];
  const image = (
    <Image
      src={src}
      alt="Oggi Sorvetes"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-9 w-auto sm:h-10 md:h-11", className)}
    />
  );

  if (!href) return image;

  return (
    <Link href={href} className="inline-flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">
      {image}
    </Link>
  );
}
