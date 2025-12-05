import type { BudgetEntry } from "@/hooks/useBudgetData";

/**
 * 집계 중간값 타입
 */
interface AggregationValues {
  totalBudget: number;
  totalActual: number;
  settledBudget: number;
  settledActual: number;
  futureBudget: number;
}

/**
 * 집계 결과 타입
 */
export interface AggregationResult {
  key: string;
  budget: number;
  actual: number;
  executionRate: number;
  remaining: number;
  projectedAnnual: number;
  settledBudget: number;
  settledActual: number;
}

/**
 * 집계 초기값 생성
 */
function createInitialValues(): AggregationValues {
  return {
    totalBudget: 0,
    totalActual: 0,
    settledBudget: 0,
    settledActual: 0,
    futureBudget: 0,
  };
}

/**
 * 엔트리를 집계값에 누적
 */
function accumulateEntry(
  values: AggregationValues,
  entry: BudgetEntry,
  settlementMonth: number
): AggregationValues {
  const isSettled = entry.month <= settlementMonth;
  
  return {
    totalBudget: values.totalBudget + entry.budgetAmount,
    totalActual: values.totalActual + entry.actualAmount,
    settledBudget: isSettled ? values.settledBudget + entry.budgetAmount : values.settledBudget,
    settledActual: isSettled ? values.settledActual + entry.actualAmount : values.settledActual,
    futureBudget: !isSettled ? values.futureBudget + entry.budgetAmount : values.futureBudget,
  };
}

/**
 * 집계값을 최종 결과로 변환
 */
function transformToResult(
  key: string,
  values: AggregationValues
): AggregationResult {
  const executionRate = values.settledBudget > 0 
    ? (values.settledActual / values.settledBudget) * 100 
    : 0;
  const executionRateDecimal = values.settledBudget > 0 
    ? values.settledActual / values.settledBudget 
    : 0;
  const projectedAnnual = values.settledActual + (values.futureBudget * executionRateDecimal);
  
  return {
    key,
    budget: values.totalBudget,
    actual: values.totalActual,
    executionRate,
    remaining: values.totalBudget - values.totalActual,
    projectedAnnual,
    settledBudget: values.settledBudget,
    settledActual: values.settledActual,
  };
}

/**
 * 제네릭 집계 함수
 * 
 * @param data 예산 데이터 배열
 * @param settlementMonth 결산 마감월 (1~12)
 * @param getKey 엔트리에서 집계 키를 추출하는 함수
 * @returns 집계 결과 배열
 */
export function aggregateByKey(
  data: BudgetEntry[],
  settlementMonth: number,
  getKey: (entry: BudgetEntry) => string
): AggregationResult[] {
  const aggregationMap = data.reduce((acc, entry) => {
    const key = getKey(entry);
    const existing = acc.get(key) || createInitialValues();
    acc.set(key, accumulateEntry(existing, entry, settlementMonth));
    return acc;
  }, new Map<string, AggregationValues>());
  
  return Array.from(aggregationMap.entries()).map(([key, values]) =>
    transformToResult(key, values)
  );
}

/**
 * 부서별 데이터 집계
 */
export function aggregateByDepartment(
  data: BudgetEntry[],
  settlementMonth: number = 9
): Array<AggregationResult & { department: string }> {
  return aggregateByKey(data, settlementMonth, (entry) => entry.department).map((result) => ({
    ...result,
    department: result.key,
  }));
}

/**
 * 계정과목별 데이터 집계
 */
export function aggregateByAccount(
  data: BudgetEntry[],
  settlementMonth: number = 9
): Array<AggregationResult & { accountCategory: string }> {
  return aggregateByKey(data, settlementMonth, (entry) => entry.accountCategory).map((result) => ({
    ...result,
    accountCategory: result.key,
  }));
}

