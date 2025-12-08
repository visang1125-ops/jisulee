import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(import.meta.dirname, "client"),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist", "public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // 청크 크기 경고 제한 설정 (KB)
  },
  // Vercel deployment configuration
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5000,
  },
});




