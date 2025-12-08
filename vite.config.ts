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
    chunkSizeWarningLimit: 2000, // 청크 크기 경고 제한 설정 (KB) - 2MB로 증가
    rollupOptions: {
      output: {
        // 청크 크기 경고 억제
        manualChunks: undefined,
      },
    },
  },
  // Vercel deployment configuration
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5000,
  },
  // PostCSS 경고 억제
  css: {
    postcss: {
      // Vite가 자동으로 from 옵션을 처리하므로 경고 무시
    },
  },
  // 로그 레벨 설정 (명령줄에서 --logLevel warn 사용)
});




