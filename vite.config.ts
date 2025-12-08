import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const rootDir = import.meta.dirname;
const clientDir = path.resolve(rootDir, "client");

export default defineConfig({
  plugins: [react()],
  root: clientDir,
  base: '/',
  resolve: {
    alias: {
      "@": path.resolve(clientDir, "src"),
      "@shared": path.resolve(rootDir, "shared"),
    },
  },
  build: {
    outDir: path.resolve(rootDir, "dist", "public"),
    emptyOutDir: true,
    assetsDir: 'assets',
    cssCodeSplit: false, // Single CSS file for better compatibility
    cssMinify: true,
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 모든 정적 파일을 assets 디렉토리에 통일 (Vercel 호환성)
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        manualChunks: undefined,
      },
      onwarn(warning, warn) {
        // Suppress known warnings
        if (warning.code === 'DEPRECATED_FEATURE') return;
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.message?.includes('chunk')) return;
        if (warning.message?.includes('PostCSS')) return;
        if (warning.message?.includes('from option')) return;
        warn(warning);
      },
    },
  },
  css: {
    postcss: path.resolve(rootDir, "postcss.config.js"),
    devSourcemap: false,
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5000,
  },
});




