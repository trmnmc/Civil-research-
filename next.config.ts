import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Archive thumbnails are served from provider CDNs. We proxy nothing in the
  // browser; images load directly from the archives with referrer stripped.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.loc.gov" },
      { protocol: "https", hostname: "loc.gov" },
      { protocol: "https", hostname: "**.archives.gov" },
      { protocol: "https", hostname: "**.virginia.edu" },
      { protocol: "https", hostname: "**.unc.edu" },
    ],
    // Remote archives are not always fast; never block the build on them.
    unoptimized: true,
  },
};

export default nextConfig;
