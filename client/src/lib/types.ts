import type { BudgetEntry } from "@/hooks/useBudgetData";

/**
 * 테이블 정렬 필드 타입
 */
export type SortField = 
  | "department"
  | "accountCategory"
  | "month"
  | "year"
  | "budgetAmount"
  | "actualAmount"
  | "executionRate"
  | "projectName"
  | "calculationBasis";

/**
 * 정렬 방향
 */
export type SortDirection = "asc" | "desc" | null;

/**
 * 정렬 상태
 */
export interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

