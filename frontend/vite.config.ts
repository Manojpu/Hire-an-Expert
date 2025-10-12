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
      port: 3000,
    },
    plugins: [react(), taggerPlugin].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
