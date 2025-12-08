/**
 * API 관련 상수
 */
// API 기본 URL: 환경 변수가 있으면 사용, 없으면 상대 경로 사용
// VITE_API_URL이 설정되어 있으면 그대로 사용하되, /api로 끝나지 않으면 자동으로 추가
const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
export const API_BASE_URL = rawApiUrl.endsWith('/api') 
  ? rawApiUrl 
  : rawApiUrl.endsWith('/') 
    ? `${rawApiUrl}api` 
    : `${rawApiUrl}/api`;

export const API_CONSTANTS = {
  // 재시도 설정
  RETRY_COUNT: 1,
  RETRY_DELAY_MS: 1000,
  
  // 타임아웃 설정
  REQUEST_TIMEOUT_MS: 30000,
  
  // 페이지네이션
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 1000,
  
  // 검증 범위
  MIN_YEAR: 2020,
  MAX_YEAR: 2030,
  MIN_MONTH: 1,
  MAX_MONTH: 12,
  
  // 금액 검증
  MIN_AMOUNT: 0,
  
  // UI 딜레이
  DOWNLOAD_DELAY_MS: 500, // 다운로드 시뮬레이션 딜레이
  SUCCESS_MESSAGE_DISPLAY_MS: 3000, // 성공 메시지 표시 시간
  FILTER_APPLY_DELAY_MS: 300, // 필터 적용 딜레이
} as const;

