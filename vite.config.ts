import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(import.meta.dirname, "client"),
  base: '/', // Vercel 배포를 위한 base 경로
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist", "public"),
    emptyOutDir: true,
    assetsDir: 'assets', // 정적 파일 디렉토리
    cssCodeSplit: false, // CSS 코드 분할 비활성화 - 모든 CSS를 하나의 파일로 빌드하여 레이아웃 문제 방지
    chunkSizeWarningLimit: 5000, // 청크 크기 경고 제한 설정 (KB) - 5MB로 증가하여 경고 억제
    rollupOptions: {
      output: {
        // 청크 크기 경고 억제
        manualChunks: undefined,
        // 정적 파일 경로 보장
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
      onwarn(warning, warn) {
        // 특정 경고 무시
        if (warning.code === 'DEPRECATED_FEATURE') return;
        if (warning.message?.includes('chunk')) return;
        if (warning.message?.includes('PostCSS')) return;
        // 나머지 경고는 표시
        warn(warning);
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




