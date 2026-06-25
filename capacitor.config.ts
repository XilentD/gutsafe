import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gutsafe.app",
  appName: "肠安地图",
  webDir: "public",
  server: {
    // Connect to Next.js dev server (or production server when deployed)
    url: "http://192.168.110.6:3000",
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
