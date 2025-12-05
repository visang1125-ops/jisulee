import { useQuery } from "@tanstack/react-query";
import { 
  calculateTotalBudget, 
  calculateTotalActual, 
  calculateSettledBudget, 
  calculateSettledActual,
  calculateExecutionRate,
  calculateExecutionRateDecimal
} from "@/utils/calculations";

export interface FilterState {
  startMonth: number;
  endMonth: number;
  year: number;
  departments: string[];
  accountCategories: string[];
}

export interface BudgetEntry {
  id: string;
  department: string;
  accountCategory: string;
  month: number;
  year: number;
  budgetAmount: number;
  actualAmount: number;
  executionRate: number;
  // 새로운 필드들
  isWithinBudget: boolean; // 예산 내/외 (예산 외는 결산에만 해당)
  businessDivision: "키즈" | "초등" | "중등" | "전체"; // 사업구분
  projectName: string; // 프로젝트명/세부항목
  calculationBasis: string; // 산정근거/집행내역 (적요를 대체)
  costType: "고정비" | "변동비"; // 고정비/변동비
}

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

/**
 * 필터 상태를 쿼리 스트링으로 변환
 */
export function buildQueryString(filters?: FilterState): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.startMonth) params.append("startMonth", filters.startMonth.toString());
  if (filters.endMonth) params.append("endMonth", filters.endMonth.toString());
  if (filters.year) params.append("year", filters.year.toString());
  filters.departments?.forEach(d => params.append("departments", d));
  filters.accountCategories?.forEach(c => params.append("accountCategories", c));
  return params.toString();
}

/**
 * 예산 데이터를 가져오는 커스텀 훅
 */
export function useBudgetData(filters?: FilterState) {
  const queryString = buildQueryString(filters);
  
  return useQuery<BudgetEntry[]>({
    queryKey: ["/api/budget", queryString],
    queryFn: async () => {
      const url = queryString ? `/api/budget?${queryString}` : "/api/budget";
      const response = await fetch(url);
      if (!response.ok) {
        let errorMessage = "데이터를 불러오는데 실패했습니다.";
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        const error = new Error(errorMessage) as Error & { status?: number; code?: string };
        error.status = response.status;
        throw error;
      }
      return response.json();
    },
    retry: 1, // API_CONSTANTS.RETRY_COUNT
    retryDelay: 1000, // API_CONSTANTS.RETRY_DELAY_MS
  });
}

/**
 * 부서별 데이터 집계
 * 
 * 필터가 적용된 데이터를 부서별로 집계합니다.
 * 
 * @param data 필터가 적용된 예산 데이터
 * @param settlementMonth 결산 마감월 (1~12)
 * @returns 부서별 집계 결과 (필터 기준의 예산 및 실제 집행 포함)
 */
export function aggregateByDepartment(data: BudgetEntry[], settlementMonth: number = 9) {
  return Array.from(
    data.reduce((acc, entry) => {
      const existing = acc.get(entry.department) || { 
        totalBudget: 0, 
        totalActual: 0, 
        settledBudget: 0, 
        settledActual: 0,
        futureBudget: 0,
      };
      
      const isSettled = entry.month <= settlementMonth;
      acc.set(entry.department, {
        totalBudget: existing.totalBudget + entry.budgetAmount,
        totalActual: existing.totalActual + entry.actualAmount,
        settledBudget: isSettled ? existing.settledBudget + entry.budgetAmount : existing.settledBudget,
        settledActual: isSettled ? existing.settledActual + entry.actualAmount : existing.settledActual,
        futureBudget: !isSettled ? existing.futureBudget + entry.budgetAmount : existing.futureBudget,
      });
      return acc;
    }, new Map<string, { 
      totalBudget: number; 
      totalActual: number; 
      settledBudget: number; 
      settledActual: number;
      futureBudget: number;
    }>())
  ).map(([department, values]) => {
    const executionRate = values.settledBudget > 0 ? (values.settledActual / values.settledBudget) * 100 : 0;
    const executionRateDecimal = values.settledBudget > 0 ? values.settledActual / values.settledBudget : 0;
    // 연간 예상 = 결산 마감월까지의 실제 집행 + (결산 마감월 이후 예산 × 집행률)
    const projectedAnnual = values.settledActual + (values.futureBudget * executionRateDecimal);
    
    return {
      department,
      budget: values.totalBudget, // 필터 기준의 부서별 예산 합계
      actual: values.totalActual, // 필터 기준의 부서별 실제 집행 합계
      executionRate, // 결산 마감월 기준의 집행률
      remaining: values.totalBudget - values.totalActual, // 필터 기준의 잔여 예산
      projectedAnnual, // 연간 예상 금액
      settledBudget: values.settledBudget, // 결산 마감월 기준의 부서별 예산
      settledActual: values.settledActual, // 결산 마감월 기준의 부서별 실제 집행
    };
  });
}


/**
 * 월별 데이터 집계
 * 
 * 필터가 적용된 데이터를 월별로 집계하여 집행률 추이를 계산합니다.
 * 
 * @param data 필터가 적용된 예산 데이터
 * @param settlementMonth 결산 마감월 (1~12)
 * @returns 월별 집계 결과 (집행률, 목표율, 예상 여부 포함)
 */
import { MONTHS_PER_YEAR } from "@shared/constants";

export function aggregateByMonth(data: BudgetEntry[], settlementMonth: number) {
  return Array.from({ length: MONTHS_PER_YEAR }, (_, i) => {
    const month = i + 1;
    const monthData = data.filter(entry => entry.month <= month && entry.month <= settlementMonth);
    const monthBudgetData = data.filter(entry => entry.month <= Math.min(month, settlementMonth));
    const monthBudget = monthBudgetData.reduce((sum, item) => sum + item.budgetAmount, 0);
    const monthActual = monthData.reduce((sum, item) => sum + item.actualAmount, 0);
    return {
      month: `${month}월`,
      executionRate: month <= settlementMonth ? (monthBudget > 0 ? (monthActual / monthBudget) * 100 : 0) : null,
      targetRate: (month / 12) * 100,
      isProjected: month > settlementMonth,
    };
  });
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

