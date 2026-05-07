import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_OG_IMAGE,
  SEO_KEYWORDS,
  getSiteUrl,
} from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Analytics } from "@/components/analytics/analytics";
import { SonnerToaster } from "@/components/ui/sonner-toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SEO_DEFAULT_DESCRIPTION,
  keywords: [...SEO_KEYWORDS],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SEO_DEFAULT_DESCRIPTION,
    images: [
      {
        url: SEO_DEFAULT_OG_IMAGE,
        width: 2400,
        height: 1600,
        alt: `${SITE_NAME} — moda artesanal com curadoria`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SEO_DEFAULT_DESCRIPTION,
    images: [SEO_DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  /** Caminhos relativos ao domínio atual — evitam conflito com `favicon.ico` antigo e hosts errados em `metadataBase`. */
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "any" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/icon.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} min-h-screen font-sans text-base text-foreground antialiased selection:bg-accent/20 selection:text-foreground`}
      >
        <SonnerToaster />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
