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

// Serwist PWA config — enable in Phase 5:
// import withSerwist from "@serwist/next";
// export default withSerwist({
//   swSrc: "src/app/sw.ts",
//   swDest: "public/sw.js",
//   disable: process.env.NODE_ENV === "development",
// })(nextConfig);
