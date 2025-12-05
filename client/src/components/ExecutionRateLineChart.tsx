import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, ComposedChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Download, Info, BarChart3, TrendingUp } from "lucide-react";
import ChartDetailDialog from "@/components/ChartDetailDialog";
import { formatCurrency } from "@/lib/utils";

interface MonthlyExecutionData {
  month: string;
  executionRate: number | null;
  targetRate: number;
  isProjected?: boolean;
}

interface MonthlyBudgetData {
  month: string;
  budget: number;
  actual: number | null;
  projected: number | null;
}

interface ExecutionRateLineChartProps {
  data: MonthlyExecutionData[];
  budgetData?: MonthlyBudgetData[];
  settlementMonth?: number;
}

export default function ExecutionRateLineChart({ data, budgetData, settlementMonth = 9 }: ExecutionRateLineChartProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [viewMode, setViewMode] = useState<"rate" | "budget">("rate");
  const [budgetViewType, setBudgetViewType] = useState<"monthly" | "cumulative">("monthly");

  const handleExportCSV = () => {
    if (viewMode === "rate") {
      const headers = ["월", "실제 집행률", "목표 집행률", "상태"];
      const rows = data.map(item => [
        item.month,
        item.executionRate !== null ? `${item.executionRate.toFixed(1)}%` : "미결산",
        `${item.targetRate.toFixed(1)}%`,
        item.isProjected ? "예상" : "실제",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `월별_집행률_추이_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else if (budgetData) {
      // 누계 데이터 계산
      const cumulativeData = budgetData.map((item, index) => {
        if (index === 0) {
          return {
            ...item,
            budget: item.budget,
            actual: item.actual ?? 0,
            projected: item.projected ?? 0,
          };
        }
        
        const prev = cumulativeData[index - 1];
        return {
          ...item,
          budget: prev.budget + item.budget,
          actual: item.actual !== null ? (prev.actual ?? 0) + item.actual : prev.actual,
          projected: item.projected !== null 
            ? (prev.actual !== null ? prev.actual : (prev.projected ?? 0)) + item.projected
            : prev.projected,
        };
      });
      
      // 누계 데이터 계산 (CSV용)
      let csvCumulativeBudget = 0;
      let csvCumulativeActual = 0;
      let csvCumulativeProjected: number | null = null;
      
      const csvCumulativeData = budgetData.map((item) => {
        csvCumulativeBudget += item.budget;
        
        if (item.actual !== null) {
          csvCumulativeActual += item.actual;
          csvCumulativeProjected = csvCumulativeActual; // 실제 집행이 있으면 예상 누계도 업데이트
        } else if (item.projected !== null) {
          // 예상 데이터: 이전 누적 예상(또는 실제 집행 누적) + 현재 예상 금액
          csvCumulativeProjected = (csvCumulativeProjected ?? csvCumulativeActual) + item.projected;
        }
        
        return {
          ...item,
          budget: csvCumulativeBudget,
          actual: item.actual !== null ? csvCumulativeActual : null,
          projected: item.projected !== null ? csvCumulativeProjected : null,
        };
      });
      
      const exportData = budgetViewType === "cumulative" ? csvCumulativeData : budgetData;
      const viewTypeLabel = budgetViewType === "cumulative" ? "누계" : "월별";
      
      const headers = ["월", "예산", "실제 집행", "실제 집행(예상)"];
      const rows = exportData.map(item => [
        item.month,
        formatCurrency(item.budget),
        item.actual !== null ? formatCurrency(item.actual) : "-",
        item.projected !== null ? formatCurrency(item.projected) : "-",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${viewTypeLabel}_예산_결산_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  return (
    <>
      <Card className="shadow-lg" data-testid="card-execution-chart">
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-card-foreground/5 to-transparent rounded-t-lg" />
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-semibold">
              {viewMode === "rate" ? "월별 집행률 추이" : budgetViewType === "cumulative" ? "누적 예산 및 결산" : "월별 예산 및 결산"}
            </CardTitle>
            <CardDescription>
              {viewMode === "rate" 
                ? "시간 경과에 따른 예산 집행률 변화" 
                : budgetViewType === "cumulative"
                ? "연간 누적 예산 대비 실제 집행(예상) 금액"
                : "월별 예산 대비 실제 집행(예상) 금액"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              결산 마감: {settlementMonth}월
            </Badge>
            {budgetData && (
              <>
                <Button
                  variant={viewMode === "budget" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(viewMode === "rate" ? "budget" : "rate")}
                  className="min-h-[44px] gap-2"
                  aria-label={viewMode === "rate" ? "예산/결산 보기" : "집행률 보기"}
                >
                  {viewMode === "rate" ? (
                    <>
                      <BarChart3 className="h-4 w-4" />
                      <span className="hidden sm:inline">예산/결산</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4" />
                      <span className="hidden sm:inline">집행률</span>
                    </>
                  )}
                </Button>
                {viewMode === "budget" && (
                  <Button
                    variant={budgetViewType === "cumulative" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBudgetViewType(budgetViewType === "monthly" ? "cumulative" : "monthly")}
                    className="min-h-[44px] gap-2"
                    aria-label={budgetViewType === "monthly" ? "누계 보기" : "월별 보기"}
                  >
                    {budgetViewType === "monthly" ? (
                      <>
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">누계</span>
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">월별</span>
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowDetail(true)}
              className="min-h-[44px] min-w-[44px]"
              aria-label="상세 정보 보기"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExportCSV}
              className="min-h-[44px] min-w-[44px]"
              aria-label="CSV 다운로드"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {viewMode === "rate" ? (
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="executionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0, 0%, 60%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(0, 0%, 60%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number | null | undefined, name: string) => {
                  if (value === null || value === undefined) return ["미결산", name];
                  return [`${Number(value).toFixed(1)}%`, name];
                }}
              />
              <ReferenceLine 
                x={`${settlementMonth}월`}
                stroke="hsl(0, 85%, 55%)"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ 
                  value: "결산 마감", 
                  position: "top",
                  fill: "hsl(0, 85%, 55%)",
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="executionRate"
                stroke="hsl(217, 91%, 50%)"
                strokeWidth={3}
                fill="url(#executionGradient)"
                name="실제 집행률"
                dot={{ fill: "hsl(217, 91%, 50%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="targetRate"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="목표 집행률"
                dot={false}
              />
            </AreaChart>
          ) : budgetData ? (() => {
            // 누계 데이터 계산
            let cumulativeBudget = 0;
            let cumulativeActual = 0;
            let cumulativeProjected: number | null = null;
            
            const cumulativeData = budgetData.map((item) => {
              cumulativeBudget += item.budget;
              
              if (item.actual !== null) {
                cumulativeActual += item.actual;
                cumulativeProjected = cumulativeActual; // 실제 집행이 있으면 예상 누계도 업데이트
              } else if (item.projected !== null) {
                // 예상 데이터: 이전 누적 예상(또는 실제 집행 누적) + 현재 예상 금액
                cumulativeProjected = (cumulativeProjected ?? cumulativeActual) + item.projected;
              }
              
              return {
                ...item,
                budget: cumulativeBudget,
                actual: item.actual !== null ? cumulativeActual : null,
                projected: item.projected !== null ? cumulativeProjected : null,
              };
            });
            
            const chartData = budgetViewType === "cumulative" ? cumulativeData : budgetData;
            
            return (
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="budgetLineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="actualLineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="projectedLineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0, 0%, 60%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(0, 0%, 60%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                fontSize={12}
                tickFormatter={(value) => {
                  const million = value / 1000000;
                  if (million >= 1000) {
                    return `${(million / 1000).toFixed(1)}억`;
                  }
                  return `${million.toFixed(0)}백만`;
                }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number, name: string) => {
                  return [formatCurrency(value), name];
                }}
              />
              <ReferenceLine 
                x={`${settlementMonth}월`}
                stroke="hsl(0, 85%, 55%)"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ 
                  value: "결산 마감", 
                  position: "top",
                  fill: "hsl(0, 85%, 55%)",
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="budget"
                stroke="hsl(217, 91%, 50%)"
                strokeWidth={3}
                fill="url(#budgetLineGradient)"
                name="예산"
                dot={{ fill: "hsl(217, 91%, 50%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(142, 71%, 45%)"
                strokeWidth={3}
                name="실제 집행"
                dot={{ fill: "hsl(142, 71%, 45%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="projected"
                stroke="hsl(0, 0%, 60%)"
                strokeWidth={3}
                strokeDasharray="5 5"
                name="실제 집행(예상)"
                dot={(props: any) => {
                  // 결산 마감월의 점은 표시하지 않음 (연결점만)
                  if (props.payload.month === `${settlementMonth}월`) {
                    return null;
                  }
                  return <circle {...props} fill="hsl(0, 0%, 60%)" strokeWidth={2} r={4} />;
                }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </ComposedChart>
            );
          })() : null}
        </ResponsiveContainer>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm">
          {viewMode === "rate" ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">실제 집행률</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-muted-foreground" style={{ borderStyle: 'dashed' }} />
                <span className="text-muted-foreground">목표 집행률</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-red-500" style={{ borderStyle: 'dashed' }} />
                <span className="text-muted-foreground">결산 마감선</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">예산</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">실제 집행</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-gray-500" style={{ borderStyle: 'dashed' }} />
                <span className="text-muted-foreground">실제 집행(예상)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-red-500" style={{ borderStyle: 'dashed' }} />
                <span className="text-muted-foreground">결산 마감선</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
    <ChartDetailDialog
      open={showDetail}
      onOpenChange={setShowDetail}
      title={viewMode === "rate" 
        ? "월별 집행률 추이" 
        : budgetViewType === "cumulative" 
        ? "누적 예산 및 결산" 
        : "월별 예산 및 결산"}
      data={viewMode === "rate" ? data : (() => {
        if (!budgetData) return [];
        if (budgetViewType === "monthly") return budgetData;
        
        // 누계 데이터 계산
        let cumulativeBudget = 0;
        let cumulativeActual = 0;
        let cumulativeProjected: number | null = null;
        
        return budgetData.map((item) => {
          cumulativeBudget += item.budget;
          
          if (item.actual !== null) {
            cumulativeActual += item.actual;
            cumulativeProjected = cumulativeActual; // 실제 집행이 있으면 예상 누계도 업데이트
          } else if (item.projected !== null) {
            // 예상 데이터: 이전 누적 예상(또는 실제 집행 누적) + 현재 예상 금액
            cumulativeProjected = (cumulativeProjected ?? cumulativeActual) + item.projected;
          }
          
          return {
            ...item,
            budget: cumulativeBudget,
            actual: item.actual !== null ? cumulativeActual : null,
            projected: item.projected !== null ? cumulativeProjected : null,
          };
        });
      })()}
      columns={viewMode === "rate" ? [
        { key: "month", label: "월" },
        { key: "executionRate", label: "실제 집행률", format: (v) => v !== null ? `${v.toFixed(1)}%` : "미결산" },
        { key: "targetRate", label: "목표 집행률", format: (v) => `${v.toFixed(1)}%` },
        { key: "isProjected", label: "상태", format: (v) => v ? "예상" : "실제" },
      ] : [
        { key: "month", label: "월" },
        { key: "budget", label: budgetViewType === "cumulative" ? "예산(누계)" : "예산", format: (v) => formatCurrency(v) },
        { key: "actual", label: budgetViewType === "cumulative" ? "실제 집행(누계)" : "실제 집행", format: (v) => v !== null ? formatCurrency(v) : "-" },
        { key: "projected", label: budgetViewType === "cumulative" ? "실제 집행(예상, 누계)" : "실제 집행(예상)", format: (v) => v !== null ? formatCurrency(v) : "-" },
      ]}
    />
    </>
  );
}
