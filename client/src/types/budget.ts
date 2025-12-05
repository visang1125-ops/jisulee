/**
 * 예산 통계 정보
 * 
 * MECE 관점에서 세 가지 예산을 명확히 구분:
 * 1. annualTotalBudget: 총 예산 (전체 연간 예산, 필터 무관, 1~12월 전체)
 * 2. filteredTotalBudget: 필터 기준의 누적 예산 (현재 필터에 해당하는 예산 합계)
 * 3. settledBudget: 결산 마감월 기준의 예산 (필터된 데이터에서 결산 마감월까지의 예산)
 */
export interface BudgetStats {
  /** 총 예산: 필터와 무관하게 전체 연간 예산 (1~12월 전체) */
  annualTotalBudget: number;
  /** 필터 기준의 누적 예산: 필터가 적용된 데이터의 전체 예산 */
  filteredTotalBudget: number;
  /** 결산 마감월 기준의 예산: 필터된 데이터에서 결산 마감월까지의 예산 */
  settledBudget: number;
  /** 필터 기준의 실제 집행 누적: 필터가 적용된 데이터의 실제 집행 합계 */
  filteredTotalActual: number;
  /** 집행률: 결산 마감월 기준의 집행률 (%) */
  executionRate: number;
  /** 연간 예상: 결산 마감월까지의 실제 집행 + (결산 마감월 이후 월들의 예산 × 집행률) */
  projectedAnnual: number;
  /** 잔여 예산: 총 예산에서 필터 기준의 실제 집행 금액을 뺀 값 */
  remainingBudget: number;
}

