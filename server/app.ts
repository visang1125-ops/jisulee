import { type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";

import { registerRoutes } from "./routes";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// 요청 타임아웃 설정 (30초)
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(408).json({ message: "Request timeout" });
    }
  });
  next();
});

// CORS 설정 (프로덕션 환경에서 프론트엔드와 백엔드가 분리된 경우)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // 개발 환경이거나 ALLOWED_ORIGINS가 설정되지 않은 경우 모든 origin 허용
  if (process.env.NODE_ENV === 'development' || !process.env.ALLOWED_ORIGINS) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // origin이 없는 경우 (예: Postman, curl 등) 모든 origin 허용
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  } else {
    // 프로덕션 환경에서 ALLOWED_ORIGINS가 설정된 경우
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    
    // Vercel 도메인 패턴 체크 (예: *.vercel.app)
    const isVercelDomain = origin && (
      origin.includes('.vercel.app') || 
      origin === 'https://jisulee.vercel.app'
    );
    
    // 정확히 일치하거나 Vercel 도메인인 경우 허용
    const isAllowed = origin && (
      allowedOrigins.includes(origin) || 
      isVercelDomain
    );
    
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (origin) {
      // 허용되지 않은 origin인 경우 로그만 남기고 계속 진행 (CORS 에러 발생)
      log(`CORS: Blocked origin ${origin}. Allowed: ${allowedOrigins.join(', ')}, Vercel domains`, "warn");
    }
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
  limit: '10mb', // JSON 페이로드 크기 제한
}));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  // 헬스체크 엔드포인트 추가
  app.get("/health", (_req, res) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
  
  const server = await registerRoutes(app);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const error = err as { status?: number; statusCode?: number; message?: string };
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    log(`Error ${status}: ${message}`, "error");
    res.status(status).json({ message });
    // 에러를 다시 던지지 않음 - 서버 크래시 방지
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      log(`Port ${port} is already in use. Please use a different port or stop the other process.`, "error");
    } else {
      log(`Server error: ${error.message}`, "error");
    }
    // 에러 발생 시에도 프로세스가 종료되지 않도록 함
  });
  
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
  
  return server;
}
