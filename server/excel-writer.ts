import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import type { BudgetEntry } from "@shared/schema";

/**
 * BudgetEntry를 엑셀 행 형식으로 변환
 */
function entryToExcelRows(entry: BudgetEntry): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = [];
  
  // 예산 행
  if (entry.budgetAmount > 0) {
    rows.push({
      '부서': entry.department,
      '계정과목': entry.accountCategory,
      '월': entry.month,
      '연도': entry.year,
      '구분': '예산',
      '금액': entry.budgetAmount,
      '예산 내/외': entry.isWithinBudget ? '예산 내' : '예산 외',
      '사업구분': entry.businessDivision,
      '프로젝트명/세부항목': entry.projectName,
      '산정근거/집행내역': entry.calculationBasis,
      '고정비/변동비': entry.costType,
    });
  }
  
  // 실제 행
  if (entry.actualAmount > 0) {
    rows.push({
      '부서': entry.department,
      '계정과목': entry.accountCategory,
      '월': entry.month,
      '연도': entry.year,
      '구분': '실제',
      '금액': entry.actualAmount,
      '예산 내/외': entry.isWithinBudget ? '예산 내' : '예산 외',
      '사업구분': entry.businessDivision,
      '프로젝트명/세부항목': entry.projectName,
      '산정근거/집행내역': entry.calculationBasis,
      '고정비/변동비': entry.costType,
    });
  }
  
  return rows;
}

/**
 * BudgetEntry 배열을 엑셀 파일로 저장
 */
export function saveBudgetEntriesToExcel(entries: BudgetEntry[], filePath: string): void {
  try {
    // 모든 엔트리를 행으로 변환
    const allRows: Array<Record<string, unknown>> = [];
    
    for (const entry of entries) {
      const rows = entryToExcelRows(entry);
      allRows.push(...rows);
    }
    
    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(allRows);
    
    // 컬럼 너비 설정
    const columnWidths = [
      { wch: 20 }, // 부서
      { wch: 25 }, // 계정과목
      { wch: 5 },  // 월
      { wch: 6 },  // 연도
      { wch: 8 },  // 구분
      { wch: 15 }, // 금액
      { wch: 12 }, // 예산 내/외
      { wch: 8 },  // 사업구분
      { wch: 25 }, // 프로젝트명/세부항목
      { wch: 30 }, // 산정근거/집행내역
      { wch: 10 }, // 고정비/변동비
    ];
    worksheet['!cols'] = columnWidths;
    
    // 워크시트 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, '예산데이터');
    
    // 디렉토리가 없으면 생성
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 파일 저장
    XLSX.writeFile(workbook, filePath);
    
    console.log(`✅ 엑셀 파일에 ${entries.length}개의 예산 항목을 저장했습니다: ${filePath}`);
  } catch (error) {
    console.error(`엑셀 파일 저장 오류: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * 기존 엑셀 파일에 새 항목 추가 (중복 체크)
 */
export function appendBudgetEntryToExcel(entry: BudgetEntry, filePath: string): void {
  try {
    let workbook: XLSX.WorkBook;
    let worksheet: XLSX.WorkSheet;
    let existingData: Array<Record<string, unknown>> = [];
    
    // 기존 파일이 있으면 읽기
    if (fs.existsSync(filePath)) {
      workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0] || '예산데이터';
      worksheet = workbook.Sheets[sheetName];
      existingData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Array<Record<string, unknown>>;
    } else {
      // 새 파일 생성
      workbook = XLSX.utils.book_new();
      worksheet = XLSX.utils.json_to_sheet([]);
    }
    
    // 새 항목을 행으로 변환
    const newRows = entryToExcelRows(entry);
    
    // 중복 체크: 같은 키(부서+계정과목+월+연도+프로젝트명+구분)가 있으면 업데이트, 없으면 추가
    const key = `${entry.department}|${entry.accountCategory}|${entry.month}|${entry.year}|${entry.projectName}`;
    
    // 기존 데이터에서 같은 키의 행 찾기 및 제거
    const filteredData = existingData.filter(row => {
      const rowKey = `${row['부서']}|${row['계정과목']}|${row['월']}|${row['연도']}|${row['프로젝트명/세부항목']}`;
      return rowKey !== key;
    });
    
    // 새 행 추가
    filteredData.push(...newRows);
    
    // 워크시트 재생성
    worksheet = XLSX.utils.json_to_sheet(filteredData);
    
    // 컬럼 너비 설정
    const columnWidths = [
      { wch: 20 }, { wch: 25 }, { wch: 5 }, { wch: 6 }, { wch: 8 },
      { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 25 }, { wch: 30 }, { wch: 10 },
    ];
    worksheet['!cols'] = columnWidths;
    
    // 워크북 업데이트
    if (workbook.SheetNames.length > 0) {
      workbook.Sheets[workbook.SheetNames[0]] = worksheet;
    } else {
      XLSX.utils.book_append_sheet(workbook, worksheet, '예산데이터');
    }
    
    // 디렉토리가 없으면 생성
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 파일 저장
    XLSX.writeFile(workbook, filePath);
    
    console.log(`✅ 엑셀 파일에 항목을 추가했습니다: ${entry.id}`);
  } catch (error) {
    console.error(`엑셀 파일 추가 오류: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}


