import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";

import { nanoid } from "nanoid";
import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";

import viteConfig from "../vite.config";
import runApp from "./app";

export async function setupVite(app: Express, server: Server) {
  const viteLogger = createLogger();
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // process.exit(1) 제거 - 서버가 계속 실행되도록 함
        // 심각한 에러만 로그로 남기고 서버는 계속 실행
        console.error("[VITE ERROR]", msg, options);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

// 전역 에러 핸들러 추가 - 서버 크래시 방지
process.on('uncaughtException', (error: Error) => {
  console.error('[UNCAUGHT EXCEPTION]', {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  });
  // 서버를 종료하지 않고 로그만 남김
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('[UNHANDLED REJECTION]', {
    timestamp: new Date().toISOString(),
    reason: reason instanceof Error ? {
      name: reason.name,
      message: reason.message,
      stack: reason.stack,
    } : reason,
    promise,
  });
  // 서버를 종료하지 않고 로그만 남김
});

// 프로세스 종료 시 정리
process.on('SIGTERM', () => {
  console.log('[SIGTERM] Server shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[SIGINT] Server shutting down gracefully...');
  process.exit(0);
});

(async () => {
  try {
    await runApp(setupVite);
  } catch (error) {
    console.error('[SERVER STARTUP ERROR]', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    });
    // 에러 발생 시에도 프로세스가 종료되지 않도록 함
    // 필요시 재시도 로직 추가 가능
  }
})();
