import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gutsafe.app",
  appName: "肠安地图",
  webDir: "out",
  server: {
    // Dev: use local Next.js server. Prod: use bundled static files.
    url: process.env.NODE_ENV === "development"
      ? "http://192.168.110.6:3000"
      : undefined,
    cleartext: true,
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
