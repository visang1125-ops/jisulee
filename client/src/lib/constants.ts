import { DEFAULT_YEAR, MONTHS_PER_YEAR } from "@shared/constants";

// 부서 목록 (shared/constants.ts와 동기화 필요)
export const DEPARTMENTS = [
  "DX전략 Core Group",
  "서비스혁신 Core",
  "플랫폼혁신 Core",
  "백오피스혁신 Core",
  "러닝마케팅 Core",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

// 계정과목 목록 (shared/constants.ts와 동기화 필요)
export const ACCOUNT_CATEGORIES = [
  "광고선전비(이벤트)",
  "통신비",
  "지급수수료",
  "지급수수료(은행수수료)",
  "지급수수료(외부용역,자문료)",
  "지급수수료(유지보수료)",
  "지급수수료(저작료)",
  "지급수수료(제휴)",
] as const;

export type AccountCategory = (typeof ACCOUNT_CATEGORIES)[number];

// 결산 마감월 기본값 (shared/constants.ts와 동기화 필요)
export const DEFAULT_SETTLEMENT_MONTH = 9;

/**
 * localStorage에서 결산 마감월을 가져옵니다.
 * 없으면 기본값을 반환합니다.
 */
export function getSettlementMonth(): number {
  if (typeof window === "undefined") return DEFAULT_SETTLEMENT_MONTH;
  const stored = localStorage.getItem("settlementMonth");
  if (stored) {
    const month = parseInt(stored, 10);
    if (month >= 1 && month <= 12) {
      return month;
    }
  }
  return DEFAULT_SETTLEMENT_MONTH;
}

// 하위 호환성을 위한 export (deprecated, getSettlementMonth() 사용 권장)
export const SETTLEMENT_MONTH = DEFAULT_SETTLEMENT_MONTH;

// 기본 필터 상태
export const DEFAULT_FILTERS = {
  startMonth: 1,
  endMonth: MONTHS_PER_YEAR,
  year: DEFAULT_YEAR,
  departments: [...DEPARTMENTS],
  accountCategories: [...ACCOUNT_CATEGORIES],
} as const;

// 뷰 타입
export type ViewType = "dashboard" | "department" | "account" | "details" | "reports" | "settlement" | "settings";

// 뷰 타이틀
export const VIEW_TITLES: Record<ViewType, string> = {
  dashboard: "대시보드",
  department: "부서별 분석",
  account: "계정과목별 분석",
  details: "상세 내역",
  reports: "보고서",
  settlement: "결산 내역 추가",
  settings: "설정",
};

// 차트 색상
export const CHART_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
];

