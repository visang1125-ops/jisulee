import { DEPARTMENTS, ACCOUNT_CATEGORIES } from "./constants";
import { BUSINESS_DIVISIONS, COST_TYPES } from "@shared/constants";

/**
 * 유효한 부서인지 확인
 */
export function isValidDepartment(value: string): boolean {
  return DEPARTMENTS.includes(value as typeof DEPARTMENTS[number]);
}

/**
 * 유효한 계정과목인지 확인
 */
export function isValidAccountCategory(value: string): boolean {
  return ACCOUNT_CATEGORIES.includes(value as typeof ACCOUNT_CATEGORIES[number]);
}

/**
 * 유효한 사업구분인지 확인
 */
export function isValidBusinessDivision(value: string): boolean {
  return BUSINESS_DIVISIONS.includes(value as typeof BUSINESS_DIVISIONS[number]);
}

/**
 * 유효한 비용 유형인지 확인
 */
export function isValidCostType(value: string): boolean {
  return COST_TYPES.includes(value as typeof COST_TYPES[number]);
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


