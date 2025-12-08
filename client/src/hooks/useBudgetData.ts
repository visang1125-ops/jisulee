import { useQuery } from "@tanstack/react-query";
import { 
  calculateTotalBudget, 
  calculateTotalActual, 
  calculateSettledBudget, 
  calculateSettledActual,
  calculateExecutionRate,
  calculateExecutionRateDecimal
} from "@/utils/calculations";
import { aggregateByDepartment, aggregateByAccount, aggregateByMonth } from "@/utils/aggregation";
import { calculateStats } from "@/utils/calculations";

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
// BudgetStats는 client/src/types/budget.ts로 이동
export type { BudgetStats } from "@/types/budget";

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
import { API_BASE_URL } from "@/lib/constants-api";

export function useBudgetData(filters?: FilterState) {
  const queryString = buildQueryString(filters);
  
  return useQuery<BudgetEntry[]>({
    queryKey: ["/api/budget", queryString],
    queryFn: async () => {
      const url = queryString ? `${API_BASE_URL}/budget?${queryString}` : `${API_BASE_URL}/budget`;
      const response = await fetch(url);
      
      // Content-Type 확인
      const contentType = response.headers.get("content-type");
      const isJson = contentType?.includes("application/json");
      
      if (!response.ok) {
        let errorMessage = "데이터를 불러오는데 실패했습니다.";
        if (isJson) {
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
        } else {
          // HTML 응답인 경우 (404 페이지 등)
          if (response.status === 404) {
            errorMessage = `API 서버를 찾을 수 없습니다. (${url}) 백엔드 서버가 실행 중인지 확인해주세요.`;
          } else {
            errorMessage = `서버 오류가 발생했습니다. (${response.status})`;
          }
        }
        const error = new Error(errorMessage) as Error & { status?: number; code?: string };
        error.status = response.status;
        throw error;
      }
      
      // JSON이 아닌 경우 에러
      if (!isJson) {
        const text = await response.text();
        throw new Error(
          `서버가 JSON이 아닌 응답을 반환했습니다. API URL이 올바른지 확인해주세요. (${url})`
        );
      }
      
      return response.json();
    },
    retry: 1, // API_CONSTANTS.RETRY_COUNT
    retryDelay: 1000, // API_CONSTANTS.RETRY_DELAY_MS
  });
}

// Re-export aggregation and calculation functions for backward compatibility
export { aggregateByDepartment, aggregateByAccount, aggregateByMonth, calculateStats };

