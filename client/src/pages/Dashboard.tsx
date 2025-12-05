import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DollarSign, Percent, TrendingUp, Target, RefreshCw, FileDown, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import KPICard from "@/components/KPICard";
import DepartmentBarChart from "@/components/DepartmentBarChart";
import ExecutionRateLineChart from "@/components/ExecutionRateLineChart";
import BudgetDonutChart from "@/components/BudgetDonutChart";
import BudgetDataTable from "@/components/BudgetDataTable";
import ImportPreviewDialog from "@/components/ImportPreviewDialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusMessage from "@/components/StatusMessage";
import ErrorDisplay from "@/components/ErrorDisplay";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import { useBudgetData, aggregateByDepartment, aggregateByAccount, aggregateByMonth, calculateStats, type FilterState } from "@/hooks/useBudgetData";
import { formatShortCurrency } from "@/lib/utils";
import { getSettlementMonth } from "@/lib/constants";
import { sumBy } from "@/utils/calculations";
import { MONTHS_PER_YEAR } from "@shared/constants";
import { logger } from "@/lib/logger";
import { downloadCSV, downloadJSON } from "@/utils/csv-export";
import { API_CONSTANTS } from "@/lib/constants-api";

interface DashboardProps {
  filters?: FilterState;
}

export default function Dashboard({ filters }: DashboardProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadType, setDownloadType] = useState<string>("");
  const [settlementMonth, setSettlementMonth] = useState(() => getSettlementMonth());
  const queryClient = useQueryClient();

  // 필터가 적용된 데이터
  const { data: budgetData = [], isLoading, isRefetching, isError, error, refetch } = useBudgetData(filters);
  // 전체 데이터 (총 예산 계산용)
  const { data: allBudgetData = [] } = useBudgetData(undefined);

  // 결산 마감월 기준 누적 집행률 계산 (메모이제이션)
  const { settledBudget, settledActual, executionRate } = useMemo(() => {
    const settledEntries = budgetData.filter(entry => entry.month <= settlementMonth);
    const budget = sumBy(settledEntries, (item) => item.budgetAmount);
    const actual = sumBy(settledEntries, (item) => item.actualAmount);
    const rate = budget > 0 ? actual / budget : 0;
    return { settledBudget: budget, settledActual: actual, executionRate: rate };
  }, [budgetData, settlementMonth]);

  // 통계 계산 (메모이제이션)
  const stats = useMemo(
    () => calculateStats(budgetData, settlementMonth, allBudgetData),
    [budgetData, settlementMonth, allBudgetData]
  );

  // 부서별 데이터 집계 (메모이제이션)
  const departmentData = useMemo(
    () => aggregateByDepartment(budgetData, settlementMonth),
    [budgetData, settlementMonth]
  );

  // 계정과목별 데이터 집계 (메모이제이션)
  const accountData = useMemo(
    () => aggregateByAccount(budgetData, settlementMonth),
    [budgetData, settlementMonth]
  );

  // 월별 데이터 집계 (메모이제이션)
  const monthlyData = useMemo(
    () => aggregateByMonth(budgetData, settlementMonth),
    [budgetData, settlementMonth]
  );

  // 월별 예산 및 결산 데이터 생성 (예상 수치 포함) (메모이제이션)
  const monthlyBudgetData = useMemo(() => {
    return Array.from({ length: MONTHS_PER_YEAR }, (_, i) => {
      const month = i + 1;
      const monthEntries = budgetData.filter(entry => entry.month === month);
      const budget = sumBy(monthEntries, (item) => item.budgetAmount);
      
      let actual: number | null = null;
      let projected: number | null = null;
      
      if (month <= settlementMonth) {
        // 결산 마감월 이하: 실제 집행 금액만
        actual = sumBy(monthEntries, (item) => item.actualAmount);
        // 결산 마감월의 경우, 예상 라인과 연결하기 위해 projected에도 값 설정
        projected = month === settlementMonth ? actual : null;
      } else {
        // 결산 마감월 초과: 예상 집행 금액 계산
        // 각 월의 예산 × 집행률
        actual = null;
        projected = budget * executionRate;
      }
      
      return {
        month: `${month}월`,
        budget,
        actual,
        projected,
      };
    });
  }, [budgetData, settlementMonth, executionRate]);

  // 도넛 차트 데이터 (메모이제이션)
  const donutData = useMemo(
    () => [
      { name: "실제 집행", value: stats.filteredTotalActual, color: "hsl(142, 71%, 45%)" },
      { name: "잔여 예산", value: stats.remainingBudget, color: "hsl(217, 91%, 50%)" },
    ],
    [stats.filteredTotalActual, stats.remainingBudget]
  );

  const handleSettlementMonthChange = (value: string) => {
    const month = parseInt(value, 10);
    setSettlementMonth(month);
    localStorage.setItem("settlementMonth", value);
    // 예산 데이터 쿼리 무효화하여 재조회
    queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
  };

  const showSuccessMessage = useCallback((type: string) => {
    setDownloadType(type);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), API_CONSTANTS.DOWNLOAD_DELAY_MS * 6);
  }, []);

  const handleDownloadCSV = async () => {
    try {
      const response = await fetch("/api/budget/export/csv");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `budget_data_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showSuccessMessage("CSV");
    } catch (error) {
      logger.error("Failed to download CSV:", error);
    }
  };

  const handleDownloadJSON = async () => {
    try {
      const response = await fetch("/api/budget/export/json");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `budget_data_${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showSuccessMessage("JSON");
    } catch (error) {
      logger.error("Failed to download JSON:", error);
    }
  };

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await fetch("/api/budget/template/csv");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "budget_template.csv";
      link.click();
      URL.revokeObjectURL(url);
      showSuccessMessage("템플릿");
    } catch (error) {
      logger.error("Failed to download template:", error);
    }
  }, [showSuccessMessage]);

  const handleTableDownloadCSV = useCallback(() => {
    const headers = ["부서", "계정과목", "예산 내/외", "사업구분", "프로젝트명", "산정근거/집행내역", "고정비/변동비", "월", "연도", "예산", "실제", "집행률"];
    const csvData = budgetData.map(entry => [
      entry.department,
      entry.accountCategory,
      entry.isWithinBudget ? "예산 내" : "예산 외",
      entry.businessDivision,
      entry.projectName,
      entry.calculationBasis,
      entry.costType,
      entry.month,
      entry.year,
      entry.budgetAmount,
      entry.actualAmount,
      entry.executionRate.toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `budget_filtered_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    showSuccessMessage("필터링된 CSV");
  }, [budgetData, showSuccessMessage]);

  const handleImport = async (entries: Array<{
    department: string;
    accountCategory: string;
    month: number;
    year: number;
    budgetAmount: number;
    actualAmount: number;
    isWithinBudget?: boolean;
    businessDivision?: string;
    projectName: string;
    calculationBasis?: string;
    costType?: string;
  }>) => {
    const response = await fetch("/api/budget/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to import entries");
    }
    
    await queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            예산 및 결산 대시보드
          </h1>
          <p className="text-muted-foreground mt-1">
            데이터를 불러오는 중 오류가 발생했습니다
          </p>
        </div>
        <ErrorDisplay
          title="데이터 로딩 실패"
          message={error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            예산 및 결산 대시보드
          </h1>
          <p className="text-muted-foreground mt-1">
            {filters ? `${filters.year}년 ${filters.startMonth}월 ~ ${filters.endMonth}월` : "2025년 1월 ~ 12월"} | 결산 마감: {settlementMonth}월
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={settlementMonth.toString()} onValueChange={handleSettlementMonthChange}>
            <SelectTrigger className="w-[140px] min-h-[44px]">
              <SelectValue placeholder="결산 마감월" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: MONTHS_PER_YEAR }, (_, i) => i + 1).map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {month}월
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ImportPreviewDialog onImport={handleImport} />
          <Button 
            variant="outline" 
            onClick={handleDownloadTemplate}
            className="gap-2 min-h-[44px]"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">템플릿</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownloadJSON}
            className="gap-2 min-h-[44px]"
          >
            <FileJson className="h-4 w-4" />
            <span className="hidden sm:inline">JSON</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2 min-h-[44px]"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefetching ? "갱신 중..." : "새로고침"}</span>
          </Button>
        </div>
      </div>

      {downloadSuccess && (
        <StatusMessage 
          type="success" 
          title="다운로드 완료" 
          message={`${downloadType} 파일이 성공적으로 다운로드되었습니다.`}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <KPICard
          title="총 예산"
          value={formatShortCurrency(stats.annualTotalBudget)}
          subtitle="연간 전체"
          icon={DollarSign}
          trend="neutral"
          colorScheme="blue"
          tooltip={`1월부터 12월까지의 모든 예산 금액을 합산한 값입니다.

필터와 무관하게 전체 연간 예산을 표시합니다.

결산 마감월(${settlementMonth}월) 기준의 예산: ${formatShortCurrency(stats.settledBudget)}`}
        />
        <KPICard
          title="집행률"
          value={`${stats.executionRate.toFixed(1)}%`}
          subtitle={`${settlementMonth}개월 기준
예산: ${formatShortCurrency(stats.settledBudget)} | 집행: ${formatShortCurrency(settledActual)}`}
          icon={Percent}
          trend={stats.executionRate > 75 ? "up" : stats.executionRate > 60 ? "neutral" : "down"}
          trendValue={stats.executionRate > 75 ? "높음" : stats.executionRate > 60 ? "보통" : "낮음"}
          colorScheme="green"
          tooltip={`결산 마감월(${settlementMonth}월)까지의 실제 집행 금액을 해당 기간의 예산으로 나눈 비율입니다.

계산식: (실제 집행 금액 ÷ 결산 마감월 기준의 예산) × 100

결산 마감월 기준의 예산: ${formatShortCurrency(stats.settledBudget)}
결산 마감월까지의 실제 집행: ${formatShortCurrency(settledActual)}

필터가 적용된 데이터에서 ${settlementMonth}월까지의 데이터만 사용됩니다.`}
        />
        <KPICard
          title="연간 예상"
          value={formatShortCurrency(stats.projectedAnnual)}
          subtitle="현재 집행률 기준"
          icon={TrendingUp}
          trend={stats.projectedAnnual < stats.annualTotalBudget ? "down" : "up"}
          trendValue={stats.projectedAnnual < stats.annualTotalBudget ? "예산 내" : "초과 예상"}
          colorScheme="orange"
          tooltip={`결산 마감월까지의 누적 집행률을 기준으로 계산한 연간 예상 금액입니다.

계산식: 결산 마감월까지의 실제 집행 금액 + (결산 마감월 이후 월들의 예산 × 집행률)

집행률 = 결산 마감월까지의 실제 집행 ÷ 결산 마감월 기준의 예산

결산 마감월 기준의 예산: 필터된 데이터에서 ${settlementMonth}월까지의 예산 합계

예: 9월까지 예산 10억원, 실제 집행 6억원(집행률 60%)
→ 10~12월 예산 3억원 × 60% = 1.8억원
→ 연간 예상 = 6억원 + 1.8억원 = 7.8억원`}
        />
        <KPICard
          title="잔여 예산"
          value={formatShortCurrency(stats.remainingBudget)}
          subtitle="미집행 금액"
          icon={Target}
          trend="neutral"
          colorScheme="purple"
          tooltip={`총 예산에서 필터 기준의 실제 집행 금액을 뺀 남은 예산입니다.

계산식: 총 예산 - 필터 기준의 실제 집행 금액

총 예산: 전체 연간 예산 (필터 무관)
필터 기준의 실제 집행: 필터가 적용된 데이터의 실제 집행 누적`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <DepartmentBarChart data={departmentData} />
        <ExecutionRateLineChart 
          data={monthlyData} 
          budgetData={monthlyBudgetData}
          settlementMonth={settlementMonth} 
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <BudgetDonutChart 
          data={donutData}
          totalBudget={stats.filteredTotalBudget}
          totalActual={stats.filteredTotalActual}
          executionRate={stats.executionRate}
          departmentData={departmentData}
          accountData={accountData}
          settlementMonth={settlementMonth}
        />
      </div>

      <BudgetDataTable 
        data={budgetData}
        onDownloadCSV={handleTableDownloadCSV}
      />
    </div>
  );
}
