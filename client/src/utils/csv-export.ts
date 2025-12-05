import type { BudgetEntry } from "@/hooks/useBudgetData";

/**
 * CSV 헤더 생성
 */
export function createCSVHeaders(): string[] {
  return [
    "부서",
    "계정과목",
    "월",
    "연도",
    "프로젝트명/세부항목",
    "산정근거/집행내역",
    "예산",
    "실제",
    "집행률(%)",
    "사업구분",
    "고정비/변동비",
  ];
}

/**
 * BudgetEntry를 CSV 행으로 변환
 */
export function entryToCSVRow(entry: BudgetEntry): string[] {
  return [
    entry.department,
    entry.accountCategory,
    String(entry.month),
    String(entry.year),
    entry.projectName,
    entry.calculationBasis,
    String(entry.budgetAmount),
    String(entry.actualAmount),
    entry.executionRate.toFixed(1),
    entry.businessDivision,
    entry.costType,
  ];
}

/**
 * CSV 다운로드
 */
export function downloadCSV(data: BudgetEntry[], filename: string = "budget-data.csv"): void {
  const headers = createCSVHeaders();
  const rows = data.map(entryToCSVRow);
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * JSON 다운로드
 */
export function downloadJSON(data: BudgetEntry[], filename: string = "budget-data.json"): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

