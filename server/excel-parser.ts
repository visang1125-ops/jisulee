import XLSX from "xlsx";
import fs from "fs";
import type { BudgetEntry, Department, AccountCategory, BusinessDivision, CostType } from "@shared/schema";
import { isBudgetType, isActualType, isValidDepartment, isValidAccountCategory, isValidBusinessDivision, isValidCostType } from "@shared/validation";
import { ERROR_MESSAGES, INFO_MESSAGES, WARNING_MESSAGES } from "@shared/constants-messages";
import { enforceSettlementConstraint, calculateExecutionRate } from "./budget-utils";
import { createEntryKey } from "@shared/excel-utils";

/**
 * 엑셀 행 데이터 타입
 */
interface ExcelRow {
  [key: string]: unknown;
}

/**
 * 파싱된 엔트리 데이터
 */
interface ParsedEntry {
  department: string;
  accountCategory: string;
  month: number;
  year: number;
  projectName: string;
  calculationBasis: string;
  type: string;
  amount: number;
  isWithinBudget?: unknown;
  businessDivision?: unknown;
  costType?: unknown;
}

/**
 * 임시 행 데이터 구조
 */
interface TempRow {
  department: string;
  accountCategory: string;
  month: number;
  year: number;
  projectName: string;
  calculationBasis: string;
  isWithinBudget: boolean;
  businessDivision: BusinessDivision;
  costType: CostType;
  budgetAmount?: number;
  actualAmount?: number;
}

/**
 * 필드 매핑 정의
 */
const FIELD_MAPPING: Record<string, string> = {
  '부서': 'department',
  '계정과목': 'accountCategory',
  '월': 'month',
  '연도': 'year',
  '구분': 'type',
  '금액': 'amount',
  '예산 내/외': 'isWithinBudget',
  '사업구분': 'businessDivision',
  '프로젝트명': 'projectName',
  '프로젝트명/세부항목': 'projectName',
  '산정근거/집행내역': 'calculationBasis',
  '고정비/변동비': 'costType',
} as const;

/**
 * 필수 컬럼 목록
 */
const REQUIRED_COLUMNS = ['부서', '계정과목', '월', '연도', '구분', '금액', '프로젝트명', '산정근거/집행내역'] as const;

/**
 * 엑셀 행을 파싱하여 ParsedEntry로 변환
 */
function parseExcelRow(row: ExcelRow, rowKeys: string[]): Partial<ParsedEntry> {
  const entry: Partial<ParsedEntry> = {};

  for (const [excelHeader, fieldName] of Object.entries(FIELD_MAPPING)) {
    // 정확한 매칭 시도
    if (row[excelHeader] !== undefined && row[excelHeader] !== '') {
      entry[fieldName as keyof ParsedEntry] = row[excelHeader] as ParsedEntry[keyof ParsedEntry];
    } else {
      // 대소문자 무시, 공백 제거하여 매칭 시도
      const normalizedHeader = excelHeader.replace(/\s+/g, '').toLowerCase();
      const matchedKey = rowKeys.find(key => {
        const normalizedKey = key.replace(/\s+/g, '').toLowerCase();
        return normalizedKey === normalizedHeader && row[key] !== undefined && row[key] !== '';
      });
      if (matchedKey) {
        entry[fieldName as keyof ParsedEntry] = row[matchedKey] as ParsedEntry[keyof ParsedEntry];
      }
    }
  }

  return entry;
}

/**
 * 필수 필드 검증
 */
function validateRequiredFields(entry: Partial<ParsedEntry>, rowIndex: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const department = String(entry.department || '').trim();
  const accountCategory = String(entry.accountCategory || '').trim();
  const projectName = String(entry.projectName || '').trim();
  const calculationBasis = String(entry.calculationBasis || '').trim();
  const type = String(entry.type || '').trim();

  if (!department) errors.push(`부서: "${department}"`);
  if (!accountCategory) errors.push(`계정과목: "${accountCategory}"`);
  if (!projectName) errors.push(`프로젝트명: "${projectName}"`);
  if (!calculationBasis) errors.push(`산정근거/집행내역: "${calculationBasis}"`);
  if (!type) errors.push(`구분: "${type}"`);

  if (errors.length > 0) {
    console.warn(`${WARNING_MESSAGES.ROW_SKIPPED.replace('{row}', String(rowIndex + 2)).replace('{message}', ERROR_MESSAGES.REQUIRED_FIELD_MISSING + ` (${errors.join(', ')})`)}`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * 구분 값 검증
 */
function validateType(type: string, rowIndex: number): boolean {
  if (!isBudgetType(type) && !isActualType(type)) {
    console.warn(
      WARNING_MESSAGES.INVALID_TYPE_VALUE
        .replace('{row}', String(rowIndex + 2))
        .replace('{type}', type)
    );
    return false;
  }
  return true;
}

/**
 * TempRow 생성
 */
function createTempRow(entry: Partial<ParsedEntry>): TempRow {
  const department = String(entry.department || '').trim();
  const accountCategory = String(entry.accountCategory || '').trim();
  const projectName = String(entry.projectName || '').trim();
  const calculationBasis = String(entry.calculationBasis || '').trim();
  
  const isWithinBudgetValue = entry.isWithinBudget;
  const isWithinBudget = isWithinBudgetValue
    ? (String(isWithinBudgetValue).trim() === '예산 내' || 
       String(isWithinBudgetValue).trim() === '예산내' || 
       String(isWithinBudgetValue).trim() === 'true')
    : true;

  const businessDivisionValue = entry.businessDivision;
  const businessDivision = (businessDivisionValue && isValidBusinessDivision(String(businessDivisionValue)))
    ? String(businessDivisionValue) as BusinessDivision
    : '전체';

  const costTypeValue = entry.costType;
  const costType = (costTypeValue && isValidCostType(String(costTypeValue)))
    ? String(costTypeValue) as CostType
    : '변동비';

  return {
    department,
    accountCategory,
    month: parseInt(String(entry.month || 1)) || 1,
    year: parseInt(String(entry.year || 2025)) || 2025,
    projectName,
    calculationBasis,
    isWithinBudget,
    businessDivision,
    costType,
  };
}

/**
 * TempRow를 BudgetEntry로 변환
 */
function convertTempRowToBudgetEntry(tempRow: TempRow, id: number): BudgetEntry {
  const budgetAmount = tempRow.budgetAmount || 0;
  const actualAmount = tempRow.actualAmount || 0;
  const settledActualAmount = enforceSettlementConstraint(tempRow.month, actualAmount);
  const executionRate = calculateExecutionRate(budgetAmount, settledActualAmount);

  // 타입 검증
  if (!isValidDepartment(tempRow.department)) {
    throw new Error(`${ERROR_MESSAGES.INVALID_DEPARTMENT}: ${tempRow.department}`);
  }
  if (!isValidAccountCategory(tempRow.accountCategory)) {
    throw new Error(`${ERROR_MESSAGES.INVALID_ACCOUNT_CATEGORY}: ${tempRow.accountCategory}`);
  }

  return {
    id: `entry-${id}`,
    department: tempRow.department as Department,
    accountCategory: tempRow.accountCategory as AccountCategory,
    month: tempRow.month,
    year: tempRow.year,
    budgetAmount,
    actualAmount: settledActualAmount,
    executionRate,
    isWithinBudget: tempRow.isWithinBudget,
    businessDivision: tempRow.businessDivision,
    projectName: tempRow.projectName,
    calculationBasis: tempRow.calculationBasis,
    costType: tempRow.costType,
  };
}

/**
 * 필수 컬럼 확인
 */
function checkRequiredColumns(firstRowKeys: string[]): void {
  const missingColumns = REQUIRED_COLUMNS.filter(col => 
    !firstRowKeys.some(key => key.trim() === col || key.replace(/\s+/g, '') === col.replace(/\s+/g, ''))
  );
  
  if (missingColumns.length > 0) {
    console.warn(`⚠️  ${WARNING_MESSAGES.REQUIRED_COLUMNS_MISSING}:`, missingColumns);
    console.warn('   실제 컬럼명:', firstRowKeys);
  }
}

/**
 * 엑셀 파일에서 예산 데이터를 로드
 */
export function loadBudgetDataFromExcel(filePath: string): BudgetEntry[] {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`${ERROR_MESSAGES.FILE_NOT_FOUND}: ${filePath}`);
      return [];
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as ExcelRow[];
    
    console.log(INFO_MESSAGES.EXCEL_READ_COMPLETE.replace('{count}', String(jsonData.length)));
    
    if (jsonData.length === 0) {
      return [];
    }

    const firstRowKeys = Object.keys(jsonData[0]);
    console.log('첫 번째 행의 컬럼명:', firstRowKeys);
    checkRequiredColumns(firstRowKeys);

    const tempMap = new Map<string, TempRow>();
    let id = 1;

    for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
      const row = jsonData[rowIndex];
      
      // 빈 행 건너뛰기
      if (!row || Object.keys(row).length === 0) {
        continue;
      }
      
      const rowKeys = Object.keys(row);
      const parsedEntry = parseExcelRow(row, rowKeys);
      
      // 디버깅: 첫 번째 행만 상세 로그
      if (rowIndex === 0) {
        console.log('첫 번째 행 파싱 결과:', parsedEntry);
      }

      // 필수 필드 검증
      const validation = validateRequiredFields(parsedEntry, rowIndex);
      if (!validation.isValid) {
        continue;
      }

      const type = String(parsedEntry.type || '').trim();
      if (!validateType(type, rowIndex)) {
        continue;
      }

      const amount = parseFloat(String(parsedEntry.amount || 0).replace(/,/g, '')) || 0;
      const department = String(parsedEntry.department || '').trim();
      const accountCategory = String(parsedEntry.accountCategory || '').trim();
      const projectName = String(parsedEntry.projectName || '').trim();
      const month = parseInt(String(parsedEntry.month || 1)) || 1;
      const year = parseInt(String(parsedEntry.year || DEFAULT_YEAR)) || DEFAULT_YEAR;

      // 키 생성: 부서+계정과목+월+연도+프로젝트명 (공통 유틸리티 사용)
      const key = `${department}|${accountCategory}|${month}|${year}|${projectName}`;
      
      // 기존 항목이 있으면 가져오고, 없으면 새로 생성
      let tempRow = tempMap.get(key);
      if (!tempRow) {
        tempRow = createTempRow(parsedEntry);
        tempMap.set(key, tempRow);
      }

      // 구분에 따라 예산 또는 실제 금액 설정
      if (isBudgetType(type)) {
        tempRow.budgetAmount = amount;
      } else if (isActualType(type)) {
        tempRow.actualAmount = amount;
      }
    }

    console.log(INFO_MESSAGES.GROUPING_COMPLETE.replace('{count}', String(tempMap.size)));
    
    // 임시 데이터를 BudgetEntry로 변환
    const entries: BudgetEntry[] = [];
    for (const tempRow of tempMap.values()) {
      try {
        entries.push(convertTempRowToBudgetEntry(tempRow, id++));
      } catch (error) {
        console.error(`행 변환 오류: ${error instanceof Error ? error.message : String(error)}`);
        // 계속 진행
      }
    }

    console.log(INFO_MESSAGES.EXCEL_LOADED.replace('{count}', String(entries.length)));
    
    if (entries.length === 0 && jsonData.length > 0) {
      console.warn(`⚠️  ${WARNING_MESSAGES.NO_DATA_AFTER_LOAD}`);
      console.warn(`   필수 컬럼: ${REQUIRED_COLUMNS.join(', ')}`);
      console.warn('   구분 컬럼은 "예산" 또는 "실제"여야 합니다.');
    }
    
    return entries;
  } catch (error) {
    console.error(`${ERROR_MESSAGES.FILE_LOAD_ERROR}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

