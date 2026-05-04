import path from "node:path";
import type { NextConfig } from "next";

const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
const r2RemotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
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
    /* URL inválida em build — ignorar */
  }
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
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
      ...r2RemotePatterns,
    ],
  },
};

export default nextConfig;
