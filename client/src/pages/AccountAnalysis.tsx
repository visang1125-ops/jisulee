import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";
import { Skeleton } from "@/components/Skeleton";
import { useBudgetData, aggregateByAccount, type FilterState } from "@/hooks/useBudgetData";
import { formatCurrency, formatShortCurrency, getExecutionRateColor, shortenAccountName } from "@/lib/utils";
import { CHART_COLORS, getSettlementMonth } from "@/lib/constants";
import { sumBy } from "@/utils/calculations";
import KPICard from "@/components/KPICard";
import { TrendingUp, DollarSign, Target } from "lucide-react";

interface AccountAnalysisProps {
  filters?: FilterState;
}

export default function AccountAnalysis({ filters }: AccountAnalysisProps) {
  const { data: budgetData = [], isLoading, isError, error, refetch } = useBudgetData(filters);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            계정과목별 분석
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
  
  // 계정과목별 데이터 집계 (메모이제이션)
  const accountData = useMemo(() => {
    return aggregateByAccount(budgetData, settlementMonth)
      .map((account, index) => ({
        ...account,
        shortName: shortenAccountName(account.accountCategory),
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.actual - a.actual);
  }, [budgetData, settlementMonth]);

  // 총계 계산 (메모이제이션)
  const { totalBudget, totalActual, totalProjectedAnnual, totalSettledBudget } = useMemo(() => {
    const budget = sumBy(accountData, (d) => d.budget);
    const actual = sumBy(accountData, (d) => d.actual);
    const projected = sumBy(accountData, (d) => d.projectedAnnual);
    const settled = sumBy(accountData, (d) => d.settledBudget);
    return { totalBudget: budget, totalActual: actual, totalProjectedAnnual: projected, totalSettledBudget: settled };
  }, [accountData]);

  const pieData = accountData.map(d => ({
    name: d.shortName,
    value: d.actual,
    color: d.color,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          계정과목별 분석
        </h1>
        <p className="text-muted-foreground mt-1">
          계정과목별 예산 집행 현황을 상세히 분석합니다
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 계정과목별 집행률 바 차트 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>계정과목별 집행률</CardTitle>
            <CardDescription>각 계정과목의 예산 대비 집행률</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={accountData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  type="number" 
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  stroke="hsl(var(--foreground))"
                />
                <YAxis 
                  type="category" 
                  dataKey="shortName" 
                  width={80}
                  stroke="hsl(var(--foreground))"
                  fontSize={11}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    const account = props.payload;
                    return [
                      `${value.toFixed(1)}% (결산 기준: ${formatShortCurrency(account.settledBudget)})`,
                      "집행률"
                    ];
                  }}
                />
                <Bar dataKey="executionRate" radius={[0, 4, 4, 0]}>
                  {accountData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 실제 집행 금액 비율 파이 차트 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>실제 집행 비율</CardTitle>
            <CardDescription>계정과목별 실제 집행 금액 비율</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 계정과목별 상세 테이블 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>계정과목별 상세 현황</CardTitle>
          <CardDescription>전체 {accountData.length}개 계정과목</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>계정과목</TableHead>
                  <TableHead className="text-right">예산</TableHead>
                  <TableHead className="text-right">실제 집행</TableHead>
                  <TableHead className="text-right">잔여</TableHead>
                  <TableHead className="text-right">집행률</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">연간 예상</TableHead>
                  <TableHead className="text-right">비중</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountData.map((account) => (
                  <TableRow key={account.accountCategory}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                        <span className="font-medium">{account.accountCategory}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(account.budget)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(account.actual)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(account.remaining)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={getExecutionRateColor(account.executionRate)}>
                          {account.executionRate.toFixed(1)}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatShortCurrency(account.settledBudget)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell font-mono">
                      {formatCurrency(account.projectedAnnual)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {((account.actual / totalActual) * 100).toFixed(1)}%
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
