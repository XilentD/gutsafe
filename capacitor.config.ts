import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gutsafe.app",
  appName: "拉了么",
  webDir: "public",
  server: {
    // Dev: use local Next.js server. Prod: omit or set CAP_SERVER_URL env var.
    url: process.env.CAP_SERVER_URL || (
      process.env.NODE_ENV === "production" ? undefined : "http://192.168.110.6:3000"
    ),
    cleartext: process.env.NODE_ENV !== "production",
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#16a34a",
    },
  },
};

export default config;
