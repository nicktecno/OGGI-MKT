import path from "node:path";
import type { NextConfig } from "next";

const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
const r2RemotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] =
  [];
if (r2Base) {
  try {
    const u = new URL(r2Base);
    if (u.protocol === "https:") {
      r2RemotePatterns.push({
        protocol: "https",
        hostname: u.hostname,
        pathname: "/**",
      });
    }
  } catch {
    /* URL inválida no build — ignorar */
  }
}

const nextConfig: NextConfig = {
  /**
   * O limite das Server Actions precisa ficar em `experimental.serverActions` — é dali que o
   * bundle app-page lê `bodySizeLimit` (um `serverActions` na raiz é ignorado).
   * Capa ~1 MB + multipart ultrapassa o limite padrão de 1 MB e falha o POST.
   */
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  outputFileTracingRoot: path.join(__dirname, "../.."),
  /** Muitos browsers pedem `/favicon.ico` por padrão; servimos o mesmo ícone PNG. */
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/loslos/favicon.png",
        permanent: false,
      },
      { source: "/loja", destination: "/fest", permanent: false },
      { source: "/loja/:path*", destination: "/fest", permanent: false },
      {
        source: "/painel/admin/loslos-fest/templates",
        destination: "/painel/admin/loslos-fest/modelos",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "sorvetesloslos.com.br",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "sp-ao.shortpixel.ai",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**",
      },
      ...r2RemotePatterns,
    ],
  },
};

export default nextConfig;
