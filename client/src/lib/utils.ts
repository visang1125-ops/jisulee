import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 숫자를 한국 원화 형식으로 포맷팅 (원화 기호 없이)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * 숫자를 백만원 단위로 축약 포맷팅 (예: 1,500백만원, 10백만원)
 */
export function formatShortCurrency(value: number): string {
  const million = value / 1000000;
  if (million >= 1000) {
    // 1,000백만원 이상인 경우 천 단위로 표시 (예: 1,500백만원)
    return `${new Intl.NumberFormat('ko-KR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(million)}백만원`;
  }
  if (million >= 1) {
    // 1백만원 이상인 경우 소수점 첫째 자리까지 표시
    return `${new Intl.NumberFormat('ko-KR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(million)}백만원`;
  }
  // 1백만원 미만인 경우 천원 단위로 표시
  const thousand = value / 1000;
  if (thousand >= 1) {
    return `${new Intl.NumberFormat('ko-KR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(thousand)}천원`;
  }
  return `${new Intl.NumberFormat('ko-KR', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)}원`;
}

/**
 * 집행률에 따른 상태 색상 반환
 */
export function getExecutionRateColor(rate: number): string {
  if (rate >= 90) return "bg-red-500";
  if (rate >= 70) return "bg-amber-500";
  return "bg-green-500";
}

/**
 * 부서명 축약
 */
export function shortenDepartmentName(name: string): string {
  return name.replace(' Core', '').replace(' Group', '');
}

/**
 * 계정과목명 축약
 */
export function shortenAccountName(name: string): string {
  return name
    .replace("지급수수료(", "")
    .replace(")", "")
    .replace("지급수수료", "수수료");
}