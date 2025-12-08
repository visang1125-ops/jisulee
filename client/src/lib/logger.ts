/**
 * 로깅 유틸리티
 * 개발 모드에서만 로그를 출력합니다.
 */

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    // 에러는 항상 로그 (프로덕션에서도 필요)
    console.error(...args);
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};


