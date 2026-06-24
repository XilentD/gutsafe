import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

// PWA via Serwist — enable when @serwist deps are compatible:
// import withSerwist from "@serwist/next";
// export default withSerwist({ swSrc: "src/app/sw.ts", swDest: "public/sw.js" })(nextConfig);
