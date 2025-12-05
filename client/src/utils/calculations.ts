import type { BudgetEntry } from "@/hooks/useBudgetData";

/**
 * 배열의 총합 계산
 */
export function sumBy<T>(items: T[], getValue: (item: T) => number): number {
  return items.reduce((sum, item) => sum + getValue(item), 0);
}

/**
 * 예산 데이터의 총 예산 계산
 */
export function calculateTotalBudget(entries: BudgetEntry[]): number {
  return sumBy(entries, (entry) => entry.budgetAmount);
}

/**
 * 예산 데이터의 총 실제 집행 금액 계산
 */
export function calculateTotalActual(entries: BudgetEntry[]): number {
  return sumBy(entries, (entry) => entry.actualAmount);
}

/**
 * 결산 마감월 기준의 총 예산 계산
 */
export function calculateSettledBudget(entries: BudgetEntry[], settlementMonth: number): number {
  return sumBy(
    entries.filter((entry) => entry.month <= settlementMonth),
    (entry) => entry.budgetAmount
  );
}

/**
 * 결산 마감월 기준의 총 실제 집행 금액 계산
 */
export function calculateSettledActual(entries: BudgetEntry[], settlementMonth: number): number {
  return sumBy(
    entries.filter((entry) => entry.month <= settlementMonth),
    (entry) => entry.actualAmount
  );
}

/**
 * 집행률 계산 (퍼센트)
 */
export function calculateExecutionRate(budget: number, actual: number): number {
  return budget > 0 ? (actual / budget) * 100 : 0;
}

/**
 * 집행률 계산 (소수)
 */
export function calculateExecutionRateDecimal(budget: number, actual: number): number {
  return budget > 0 ? actual / budget : 0;
}

