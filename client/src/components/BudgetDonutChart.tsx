import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatShortCurrency, getExecutionRateColor } from "@/lib/utils";

interface BudgetComparisonData {
  name: string;
  value: number;
  color: string;
}

interface BudgetDonutChartProps {
  data: BudgetComparisonData[];
  totalBudget: number;
  totalActual: number;
  executionRate: number;
  departmentData?: Array<{
    department: string;
    budget: number;
    actual: number;
    executionRate: number;
    settledBudget: number;
  }>;
  accountData?: Array<{
    accountCategory: string;
    budget: number;
    actual: number;
    executionRate: number;
    settledBudget: number;
  }>;
  settlementMonth: number;
}

export default function BudgetDonutChart({ 
  data, 
  totalBudget, 
  totalActual, 
  executionRate,
  departmentData = [],
  accountData = [],
  settlementMonth
}: BudgetDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const budgetDifference = totalBudget - totalActual; // 절감(+) 또는 초과(-)
  const isOverBudget = budgetDifference < 0;
  
  // executionRate가 없을 경우를 대비한 기본값
  const safeExecutionRate = executionRate || 0;
  
  // 집행률이 높은 항목 (80% 이상) - 위험 신호
  const highRiskDepartments = departmentData.filter(d => d.executionRate >= 80).slice(0, 3);
  const highRiskAccounts = accountData.filter(a => a.executionRate >= 80).slice(0, 3);

  return (
    <Card className="shadow-lg" data-testid="card-donut-chart">
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-card-foreground/5 to-transparent rounded-t-lg" />
      <CardHeader>
        <CardTitle className="text-lg font-semibold">예산 vs 실제 비교</CardTitle>
        <CardDescription>필터 기준의 예산 대비 실제 집행 현황</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 파이 차트 영역 */}
          <div className="flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <defs>
                  {data.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`donutGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                  label={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#donutGradient${index})`} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number) => formatShortCurrency(value)}
                />
                <text
                  x="50%"
                  y="48%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground font-bold text-3xl"
                >
                  {safeExecutionRate.toFixed(1)}%
                </text>
                <text
                  x="50%"
                  y="56%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-sm"
                >
                  집행률
                </text>
              </PieChart>
            </ResponsiveContainer>
            
            {/* 범례를 차트 아래로 이동 */}
            <div className="flex items-center justify-center gap-6 mt-4">
              {data.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{entry.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatShortCurrency(entry.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 핵심 지표 영역 */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <p className="text-sm font-semibold mb-4">핵심 지표</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">총 예산</p>
                  <p className="text-xl font-bold font-mono">{formatShortCurrency(totalBudget)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">실제 집행</p>
                  <p className="text-xl font-bold font-mono">{formatShortCurrency(totalActual)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">잔여 예산</p>
                  <p className={`text-xl font-bold font-mono ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    {formatShortCurrency(Math.abs(budgetDifference))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isOverBudget ? '초과' : '절감'}
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">결산 기준</p>
                  <p className="text-xl font-bold font-mono">{settlementMonth}월</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {safeExecutionRate.toFixed(1)}% 집행
                  </p>
                </div>
              </div>
            </div>
            
            {/* 사용률 표시 */}
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">예산 사용률</span>
                <span className="text-sm font-bold">{((totalActual / totalBudget) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((totalActual / totalBudget) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        

        {/* 위험 항목 알림 (C레벨용) */}
        {(highRiskDepartments.length > 0 || highRiskAccounts.length > 0) && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-semibold text-amber-600 mb-3">⚠️ 집행률 80% 이상 항목</p>
            <div className="space-y-2">
              {highRiskDepartments.map((dept) => (
                <div key={dept.department} className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <span className="text-sm font-medium">{dept.department}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatShortCurrency(dept.settledBudget)}
                    </span>
                    <Badge className={getExecutionRateColor(dept.executionRate)}>
                      {dept.executionRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
              {highRiskAccounts.map((account) => (
                <div key={account.accountCategory} className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <span className="text-sm font-medium">{account.accountCategory}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatShortCurrency(account.settledBudget)}
                    </span>
                    <Badge className={getExecutionRateColor(account.executionRate)}>
                      {account.executionRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 부서별 상세 정보 (실무자용) */}
        {departmentData.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-semibold mb-3">부서별 집행 현황</p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">부서</TableHead>
                    <TableHead className="text-right">예산</TableHead>
                    <TableHead className="text-right">집행</TableHead>
                    <TableHead className="text-right">집행률</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentData.slice(0, 5).map((dept) => (
                    <TableRow key={dept.department}>
                      <TableCell className="font-medium text-sm">{dept.department}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatShortCurrency(dept.budget)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatShortCurrency(dept.actual)}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={getExecutionRateColor(dept.executionRate)}>
                          {dept.executionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
