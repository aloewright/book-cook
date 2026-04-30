import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./client/routes",
      generatedRouteTree: "./client/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    cloudflare({ configPath: "./wrangler.jsonc" }),
  ],
  build: { outDir: "dist/client", emptyOutDir: true },
  resolve: {
    alias: { "@": "/src", "@client": "/client" },
  },
});
