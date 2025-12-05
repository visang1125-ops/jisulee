import type { Department, AccountCategory, BusinessDivision, CostType } from "./schema";
import { DEPARTMENTS, ACCOUNT_CATEGORIES, BUSINESS_DIVISIONS, COST_TYPES } from "./constants";

/**
 * 유효한 부서인지 확인
 */
export function isValidDepartment(value: string): value is Department {
  return DEPARTMENTS.includes(value as Department);
}

/**
 * 유효한 계정과목인지 확인
 */
export function isValidAccountCategory(value: string): value is AccountCategory {
  return ACCOUNT_CATEGORIES.includes(value as AccountCategory);
}

/**
 * 유효한 사업구분인지 확인
 */
export function isValidBusinessDivision(value: string): value is BusinessDivision {
  return BUSINESS_DIVISIONS.includes(value as BusinessDivision);
}

/**
 * 유효한 비용 유형인지 확인
 */
export function isValidCostType(value: string): value is CostType {
  return COST_TYPES.includes(value as CostType);
}

/**
 * 구분 값이 예산인지 확인
 */
export function isBudgetType(type: string): boolean {
  const normalized = type.trim().toLowerCase();
  return normalized === "예산" || normalized === "계획" || normalized === "budget" || normalized === "plan";
}

/**
 * 구분 값이 실제인지 확인
 */
export function isActualType(type: string): boolean {
  const normalized = type.trim().toLowerCase();
  return normalized === "실제" || normalized === "집행" || normalized === "actual" || normalized === "execution";
}

/**
 * 유효한 구분 값인지 확인
 */
export function isValidType(type: string): boolean {
  return isBudgetType(type) || isActualType(type);
}

