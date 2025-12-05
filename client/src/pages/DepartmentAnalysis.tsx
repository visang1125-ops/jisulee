import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";
import { Skeleton } from "@/components/Skeleton";
import { useBudgetData, aggregateByDepartment, type FilterState } from "@/hooks/useBudgetData";
import { formatCurrency, formatShortCurrency, getExecutionRateColor, shortenDepartmentName } from "@/lib/utils";
import { CHART_COLORS, getSettlementMonth } from "@/lib/constants";
import { sumBy } from "@/utils/calculations";
import KPICard from "@/components/KPICard";
import { TrendingUp, DollarSign, Target } from "lucide-react";

interface DepartmentAnalysisProps {
  filters?: FilterState;
}

export default function DepartmentAnalysis({ filters }: DepartmentAnalysisProps) {
  const { data: budgetData = [], isLoading, isError, error, refetch } = useBudgetData(filters);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            부서별 분석
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
  
  // 부서별 데이터 집계 (메모이제이션)
  const departmentData = useMemo(() => {
    return aggregateByDepartment(budgetData, settlementMonth).map((dept, index) => ({
      ...dept,
      shortName: shortenDepartmentName(dept.department),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [budgetData, settlementMonth]);

  // 총계 계산 (메모이제이션)
  const { totalBudget, totalActual, totalProjectedAnnual, totalSettledBudget } = useMemo(() => {
    const budget = sumBy(departmentData, (d) => d.budget);
    const actual = sumBy(departmentData, (d) => d.actual);
    const projected = sumBy(departmentData, (d) => d.projectedAnnual);
    const settled = sumBy(departmentData, (d) => d.settledBudget);
    return { totalBudget: budget, totalActual: actual, totalProjectedAnnual: projected, totalSettledBudget: settled };
  }, [departmentData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          부서별 분석
        </h1>
        <p className="text-muted-foreground mt-1">
          각 부서의 예산 집행 현황을 상세히 분석합니다
        </p>
      </div>

      {/* 연간 예상 비용 KPI 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <KPICard
          title="총 예산"
          value={formatShortCurrency(totalBudget)}
          subtitle="필터 기준"
          icon={DollarSign}
          trend="neutral"
          colorScheme="blue"
          tooltip={`필터가 적용된 데이터의 예산 합계입니다.

현재 선택된 필터(부서, 계정과목, 월 범위)에 해당하는 예산만 포함됩니다.`}
        />
        <KPICard
          title="실제 집행"
          value={formatShortCurrency(totalActual)}
          subtitle="필터 기준"
          icon={Target}
          trend="neutral"
          colorScheme="green"
          tooltip={`필터가 적용된 데이터의 실제 집행 금액 합계입니다.

현재 선택된 필터(부서, 계정과목, 월 범위)에 해당하는 실제 집행 금액만 포함됩니다.`}
        />
        <KPICard
          title="연간 예상"
          value={formatShortCurrency(totalProjectedAnnual)}
          subtitle="현재 집행률 기준"
          icon={TrendingUp}
          trend={totalProjectedAnnual < totalBudget ? "down" : "up"}
          trendValue={totalProjectedAnnual < totalBudget ? "예산 내" : "예산 초과"}
          colorScheme="orange"
          tooltip={`결산 마감월까지의 누적 집행률을 기준으로 계산한 연간 예상 금액입니다.

계산식: 결산 마감월까지의 실제 집행 금액 + (결산 마감월 이후 월들의 예산 × 집행률)

집행률 = 결산 마감월까지의 실제 집행 ÷ 결산 마감월 기준의 예산

결산 마감월 기준의 예산: 필터된 데이터에서 ${settlementMonth}월까지의 예산 합계`}
        />
      </div>

      {/* 부서별 예산 비교 차트 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>부서별 예산 vs 실제 집행</CardTitle>
          <CardDescription>각 부서의 예산 대비 실제 집행 금액 비교</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="shortName" stroke="hsl(var(--foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickFormatter={formatShortCurrency} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="budget" fill="#3b82f6" name="예산" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="#10b981" name="실제 집행" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 부서별 집행률 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {departmentData.map((dept) => (
          <Card key={dept.department} className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">{dept.shortName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">집행률</span>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={getExecutionRateColor(dept.executionRate)}>
                    {dept.executionRate.toFixed(1)}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    결산 기준: {formatShortCurrency(dept.settledBudget)}
                  </span>
                </div>
              </div>
              <Progress value={dept.executionRate} className="h-2" />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">예산</p>
                  <p className="font-mono font-medium">{formatShortCurrency(dept.budget)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">실제</p>
                  <p className="font-mono font-medium">{formatShortCurrency(dept.actual)}</p>
                </div>
              </div>
              <div className="pt-2 border-t space-y-2">
                <div>
                  <p className="text-muted-foreground text-sm">잔여 예산</p>
                  <p className="font-mono font-bold text-lg" style={{ color: dept.color }}>
                    {formatShortCurrency(dept.remaining)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">연간 예상</p>
                  <p className="font-mono font-semibold text-sm" style={{ color: dept.color }}>
                    {formatShortCurrency(dept.projectedAnnual)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 부서별 상세 테이블 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>부서별 상세 현황</CardTitle>
          <CardDescription>전체 예산 대비 {((totalActual / totalBudget) * 100).toFixed(1)}% 집행 완료</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>부서명</TableHead>
                <TableHead className="text-right">예산</TableHead>
                <TableHead className="text-right">실제 집행</TableHead>
                <TableHead className="text-right">잔여 예산</TableHead>
                <TableHead className="text-right">집행률</TableHead>
                <TableHead className="text-right hidden lg:table-cell">연간 예상</TableHead>
                <TableHead className="text-right">전체 비중</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentData.map((dept) => (
                <TableRow key={dept.department}>
                  <TableCell className="font-medium">{dept.shortName}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(dept.budget)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(dept.actual)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(dept.remaining)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={getExecutionRateColor(dept.executionRate)}>
                        {dept.executionRate.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatShortCurrency(dept.settledBudget)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell font-mono">
                    {formatCurrency(dept.projectedAnnual)}
                  </TableCell>
                  <TableCell className="text-right">
                    {((dept.budget / totalBudget) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>합계</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(totalBudget)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(totalActual)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(totalBudget - totalActual)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <Badge className="bg-primary">{((totalActual / totalBudget) * 100).toFixed(1)}%</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatShortCurrency(totalSettledBudget)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right hidden lg:table-cell font-mono">
                  {formatCurrency(totalProjectedAnnual)}
                </TableCell>
                <TableCell className="text-right">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
