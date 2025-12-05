import { SETTLEMENT_MONTH } from "@shared/constants";

/**
 * 집행률 계산
 * @param budgetAmount 예산 금액
 * @param actualAmount 실제 집행 금액
 * @returns 집행률 (퍼센트)
 */
export function calculateExecutionRate(budgetAmount: number, actualAmount: number): number {
  return budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;
}

/**
 * 결산 마감월 제약 조건 적용
 * 결산 마감월 이후의 실제 집행 금액은 0으로 처리
 * @param month 월 (1-12)
 * @param actualAmount 실제 집행 금액
 * @returns 제약 조건이 적용된 실제 집행 금액
 */
export function enforceSettlementConstraint(month: number, actualAmount: number): number {
  return month > SETTLEMENT_MONTH ? 0 : actualAmount;
}

