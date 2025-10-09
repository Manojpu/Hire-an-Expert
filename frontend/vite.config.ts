import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  let taggerPlugin = undefined;
  if (mode === "development") {
    const mod = await import("lovable-tagger");
    taggerPlugin = mod.componentTagger();
  }
  return {
    server: {
      host: "::",
      port: 8080,
      cors: {
        origin: ["https://r.stripe.com", "http://localhost:8004"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      },
      headers: {
        "Content-Security-Policy": `
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://r.stripe.com;
          style-src 'self' 'unsafe-inline';
          img-src 'self' data: https: http:;
          connect-src 'self' http://localhost:* https://api.stripe.com https://r.stripe.com;
          frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
          font-src 'self' data:;
        `
          .replace(/\s+/g, " ")
          .trim(),
      },
    },
    plugins: [react(), taggerPlugin].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
