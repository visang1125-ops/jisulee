import type { BudgetEntry } from "./schema";

/**
 * BudgetEntry를 엑셀 행 키로 변환
 */
export function createEntryKey(entry: BudgetEntry): string {
  return `${entry.department}|${entry.accountCategory}|${entry.month}|${entry.year}|${entry.projectName}`;
}

/**
 * 엑셀 행 데이터에서 키 생성
 */
export function createRowKey(row: Record<string, unknown>): string {
  return `${row['부서']}|${row['계정과목']}|${row['월']}|${row['연도']}|${row['프로젝트명/세부항목']}`;
}

/**
 * 그룹화된 엔트리 타입
 */
export interface GroupedEntry {
  department: string;
  accountCategory: string;
  month: number;
  year: number;
  projectName: string;
  calculationBasis: string;
  isWithinBudget: boolean;
  businessDivision: string;
  costType: string;
  budgetAmount: number;
  actualAmount: number;
}

/**
 * 엔트리에서 키 생성 (내부 헬퍼)
 */
function createEntryKeyFromEntry(entry: { department: string; accountCategory: string; month: number; year: number; projectName: string }): string {
  return `${entry.department}|${entry.accountCategory}|${entry.month}|${entry.year}|${entry.projectName}`;
}

/**
 * 엔트리들을 키로 그룹화하여 예산과 실제를 합침
 * 
 * @param entries 그룹화할 엔트리 배열
 * @param getAmount 엔트리에서 예산/실제 구분과 금액을 추출하는 함수
 * @param getDefaults 엔트리에서 기본값을 추출하는 함수
 * @returns 그룹화된 엔트리 맵
 */
export function groupEntriesByKey<T extends { department: string; accountCategory: string; month: number; year: number; projectName: string }>(
  entries: T[],
  getAmount: (entry: T) => { isBudget: boolean; amount: number },
  getDefaults: (entry: T) => Partial<GroupedEntry> = () => ({})
): Map<string, GroupedEntry> {
  const groupedMap = new Map<string, GroupedEntry>();
  
  for (const entry of entries) {
    const key = createEntryKeyFromEntry(entry);
    const { isBudget, amount } = getAmount(entry);
    const defaults = getDefaults(entry);
    
    let grouped = groupedMap.get(key);
    if (!grouped) {
      grouped = {
        department: entry.department,
        accountCategory: entry.accountCategory,
        month: entry.month,
        year: entry.year,
        projectName: entry.projectName,
        calculationBasis: defaults.calculationBasis || '',
        isWithinBudget: defaults.isWithinBudget ?? true,
        businessDivision: defaults.businessDivision || '전체',
        costType: defaults.costType || '변동비',
        budgetAmount: 0,
        actualAmount: 0,
      };
      groupedMap.set(key, grouped);
    }
    
    if (isBudget) {
      grouped.budgetAmount = amount;
    } else {
      grouped.actualAmount = amount;
    }
  }
  
  return groupedMap;
}

