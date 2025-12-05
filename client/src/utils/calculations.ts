import type { BudgetEntry } from "@/hooks/useBudgetData";
import type { BudgetStats } from "@/types/budget";

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

/**
 * 예산 통계 계산
 * 
 * MECE 관점에서 세 가지 예산을 명확히 구분하여 계산합니다.
 * 
 * @param data 필터가 적용된 예산 데이터
 * @param settlementMonth 결산 마감월 (1~12)
 * @param allData 전체 예산 데이터 (필터 미적용, 총 예산 계산용). 제공되지 않으면 data를 사용
 * @returns BudgetStats 예산 통계 정보
 */

export function calculateStats(data: BudgetEntry[], settlementMonth: number, allData?: BudgetEntry[]): BudgetStats {
  const allBudgetData = allData || data; // 전체 데이터가 없으면 필터된 데이터 사용
  
  // 1. 총 예산: 필터와 무관하게 전체 연간 예산 (1~12월 전체)
  const annualTotalBudget = calculateTotalBudget(allBudgetData);
  
  // 2. 필터 기준의 누적 예산: 필터가 적용된 데이터의 전체 예산
  const filteredTotalBudget = calculateTotalBudget(data);
  
  // 3. 결산 마감월 기준의 예산: 필터된 데이터에서 결산 마감월까지의 예산
  const settledBudget = calculateSettledBudget(data, settlementMonth);
  
  // 실제 집행 금액
  const settledActual = calculateSettledActual(data, settlementMonth); // 결산 마감월까지의 실제 집행 누적
  const filteredTotalActual = calculateTotalActual(data); // 필터 기준의 실제 집행 누적
  
  // 집행률 계산 (결산 마감월 기준)
  const executionRate = calculateExecutionRate(settledBudget, settledActual);
  
  // 연간 예상 금액: 결산 마감월까지의 실제 집행 + (결산 마감월 이후 월들의 예산 × 집행률)
  const executionRateDecimal = calculateExecutionRateDecimal(settledBudget, settledActual); // 집행률 (0~1)
  const futureMonthsData = data.filter(item => item.month > settlementMonth);
  const futureMonthsBudget = calculateTotalBudget(futureMonthsData);
  const projectedFuture = futureMonthsBudget * executionRateDecimal; // 결산 마감월 이후 예상 집행
  const projectedAnnual = settledActual + projectedFuture; // 연간 예상 = 결산 마감월까지 실제 집행 + 예상 집행
  
  // 잔여 예산: 총 예산에서 필터 기준의 실제 집행 금액을 뺀 값
  const remainingBudget = annualTotalBudget - filteredTotalActual;

  return {
    annualTotalBudget,
    filteredTotalBudget,
    settledBudget,
    filteredTotalActual,
    executionRate,
    projectedAnnual,
    remainingBudget,
  };
}

