import type { Department, AccountCategory, BusinessDivision, CostType } from "./schema";

// 부서 목록
export const DEPARTMENTS: Department[] = [
  "DX전략 Core Group",
  "서비스혁신 Core",
  "플랫폼혁신 Core",
  "백오피스혁신 Core",
  "러닝마케팅 Core",
];

// 계정과목 목록
export const ACCOUNT_CATEGORIES: AccountCategory[] = [
  "광고선전비(이벤트)",
  "통신비",
  "지급수수료",
  "지급수수료(은행수수료)",
  "지급수수료(외부용역,자문료)",
  "지급수수료(유지보수료)",
  "지급수수료(저작료)",
  "지급수수료(제휴)",
];

// 사업구분 목록
export const BUSINESS_DIVISIONS: BusinessDivision[] = [
  "키즈",
  "초등",
  "중등",
  "전체",
];

// 비용 유형 목록
export const COST_TYPES: CostType[] = [
  "고정비",
  "변동비",
];

// 결산 마감월
export const SETTLEMENT_MONTH = 9;

// 시간 관련 상수
export const MONTHS_PER_YEAR = 12; // 연간 월 수
export const DEFAULT_YEAR = 2025; // 기본 연도
export const MIN_YEAR = 2020; // 최소 연도
export const MAX_YEAR = 2030; // 최대 연도
export const MIN_MONTH = 1; // 최소 월
export const MAX_MONTH = 12; // 최대 월




