import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileJson, FileSpreadsheet, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusMessage from "@/components/StatusMessage";
import ErrorDisplay from "@/components/ErrorDisplay";
import { Skeleton } from "@/components/Skeleton";
import { useBudgetData, aggregateByDepartment, aggregateByAccount, calculateStats, type FilterState } from "@/hooks/useBudgetData";
import { formatCurrency, formatShortCurrency, getExecutionRateColor, shortenDepartmentName } from "@/lib/utils";
import { getSettlementMonth } from "@/lib/constants";
import { API_CONSTANTS } from "@/lib/constants-api";

interface ReportsPageProps {
  filters?: FilterState;
}

export default function ReportsPage({ filters }: ReportsPageProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadType, setDownloadType] = useState("");

  // 필터가 적용된 데이터
  const { data: budgetData = [], isLoading, isError, error, refetch } = useBudgetData(filters);
  // 전체 데이터 (총 예산 계산용)
  const { data: allBudgetData = [] } = useBudgetData(undefined);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            보고서
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

  const settlementMonth = getSettlementMonth();
  
  // 통계 계산 (메모이제이션)
  const stats = useMemo(
    () => calculateStats(budgetData, settlementMonth, allBudgetData),
    [budgetData, settlementMonth, allBudgetData]
  );
  
  // 부서별 집계 (메모이제이션)
  const departmentSummary = useMemo(
    () => aggregateByDepartment(budgetData, settlementMonth),
    [budgetData, settlementMonth]
  );
  
  // 계정과목별 집계 (메모이제이션)
  const accountSummary = useMemo(
    () => aggregateByAccount(budgetData, settlementMonth),
    [budgetData, settlementMonth]
  );

  // 위험 항목 (집행률 90% 이상) (메모이제이션)
  type SummaryItem = typeof departmentSummary[0] | typeof accountSummary[0];
  const riskItems: SummaryItem[] = useMemo(() => {
    return [...departmentSummary, ...accountSummary].filter(item => item.executionRate >= 90);
  }, [departmentSummary, accountSummary]);

  const showSuccessMessage = (type: string) => {
    setDownloadType(type);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), API_CONSTANTS.SUCCESS_MESSAGE_DISPLAY_MS);
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await fetch("/api/budget/export/csv");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `budget_report_${new Date().toISOString().split("T")[0]}.csv`;
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
      link.download = `budget_report_${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showSuccessMessage("JSON");
    } catch (error) {
      logger.error("Failed to download JSON:", error);
    }
  };

  const handleDownloadSummary = () => {
    const summaryReport = {
      generatedAt: new Date().toISOString(),
      period: `${filters?.year || 2025}년 ${filters?.startMonth || 1}월 ~ ${filters?.endMonth || 12}월`,
      settlementMonth: settlementMonth,
      overview: {
        annualTotalBudget: stats.annualTotalBudget,
        filteredTotalBudget: stats.filteredTotalBudget,
        settledBudget: stats.settledBudget,
        filteredTotalActual: stats.filteredTotalActual,
        remainingBudget: stats.remainingBudget,
        executionRate: stats.executionRate.toFixed(2) + "%",
        projectedAnnual: stats.projectedAnnual,
      },
      departmentSummary,
      accountSummary,
      riskItems: riskItems.map(item => ({
        name: 'department' in item ? item.department : item.accountCategory,
        executionRate: item.executionRate.toFixed(2) + "%",
        settledBudget: 'settledBudget' in item ? item.settledBudget : 0,
      })),
    };

    const blob = new Blob([JSON.stringify(summaryReport, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `summary_report_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    showSuccessMessage("요약 보고서");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          보고서
        </h1>
        <p className="text-muted-foreground mt-1">
          예산 현황 보고서를 조회하고 다운로드합니다
        </p>
      </div>

      {downloadSuccess && (
        <StatusMessage 
          type="success" 
          title="다운로드 완료" 
          message={`${downloadType} 파일이 성공적으로 다운로드되었습니다.`}
        />
      )}

      {/* 다운로드 카드 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>데이터 내보내기</CardTitle>
          <CardDescription>원하는 형식으로 데이터를 다운로드하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button variant="outline" onClick={handleDownloadCSV} className="h-24 flex-col gap-2">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <span>CSV 다운로드</span>
              <span className="text-xs text-muted-foreground">Excel 호환</span>
            </Button>
            <Button variant="outline" onClick={handleDownloadJSON} className="h-24 flex-col gap-2">
              <FileJson className="h-8 w-8 text-blue-600" />
              <span>JSON 다운로드</span>
              <span className="text-xs text-muted-foreground">개발자용</span>
            </Button>
            <Button variant="outline" onClick={handleDownloadSummary} className="h-24 flex-col gap-2">
              <FileDown className="h-8 w-8 text-purple-600" />
              <span>요약 보고서</span>
              <span className="text-xs text-muted-foreground">분석 결과 포함</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 요약 보고서 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>예산 현황 요약</CardTitle>
          <CardDescription>{filters?.year || DEFAULT_YEAR}년 {settlementMonth}월 결산 기준</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 주요 지표 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">총 예산</p>
              <p className="text-xl font-bold font-mono">{formatCurrency(stats.annualTotalBudget)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">실제 집행</p>
              <p className="text-xl font-bold font-mono">{formatCurrency(stats.filteredTotalActual)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">집행률</p>
              <p className="text-xl font-bold">{stats.executionRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                결산 기준: {formatShortCurrency(stats.settledBudget)}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">연간 예상</p>
              <p className="text-xl font-bold font-mono">{formatCurrency(stats.projectedAnnual)}</p>
            </div>
          </div>

          {/* 예산 대비 분석 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {stats.projectedAnnual <= stats.annualTotalBudget ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  )}
                  연간 예상 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  현재 집행 추세 기준, 연간 {formatCurrency(stats.projectedAnnual)} 지출 예상
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {stats.projectedAnnual <= stats.annualTotalBudget ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">
                        예산 내 {formatCurrency(stats.annualTotalBudget - stats.projectedAnnual)} 절감 예상
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 font-medium">
                        예산 초과 {formatCurrency(stats.projectedAnnual - stats.annualTotalBudget)} 예상
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  주의 필요 항목
                </CardTitle>
              </CardHeader>
              <CardContent>
                {riskItems.length > 0 ? (
                  <div className="space-y-2">
                    {riskItems.slice(0, 3).map((item, index) => {
                      const name = 'department' in item ? item.department : item.accountCategory;
                      const settledBudget = 'settledBudget' in item ? item.settledBudget : 0;
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{name}</span>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={getExecutionRateColor(item.executionRate)}>
                              {item.executionRate.toFixed(1)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatShortCurrency(settledBudget)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {riskItems.length > 3 && (
                      <p className="text-xs text-muted-foreground">외 {riskItems.length - 3}개 항목</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">집행률 90% 이상 항목이 없습니다</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 부서별 요약 */}
          <div>
            <h3 className="font-semibold mb-3">부서별 집행 현황</h3>
            <div className="space-y-2">
              {departmentSummary.map((dept) => (
                <div key={dept.department} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="font-medium">{shortenDepartmentName(dept.department)}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm">{formatCurrency(dept.actual)}</span>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={getExecutionRateColor(dept.executionRate)}>
                        {dept.executionRate.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatShortCurrency(dept.settledBudget)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
