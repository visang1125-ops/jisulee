import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download, Info } from "lucide-react";
import ChartDetailDialog from "@/components/ChartDetailDialog";
import { formatCurrency, shortenDepartmentName } from "@/lib/utils";

interface DepartmentData {
  department: string;
  budget: number;
  actual: number;
  executionRate: number;
}

interface DepartmentBarChartProps {
  data: DepartmentData[];
}

export default function DepartmentBarChart({ data }: DepartmentBarChartProps) {
  const [showDetail, setShowDetail] = useState(false);
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `₩${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `₩${(value / 1000000).toFixed(0)}M`;
    return `₩${(value / 1000).toFixed(0)}K`;
  };

  const handleExportCSV = () => {
    const headers = ["부서", "예산", "실제 집행", "집행률", "잔여 예산"];
    const rows = data.map(item => [
      item.department,
      item.budget,
      item.actual,
      item.executionRate.toFixed(1) + "%",
      item.budget - item.actual,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `부서별_예산현황_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <Card className="shadow-lg" data-testid="card-department-chart">
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-card-foreground/5 to-transparent rounded-t-lg" />
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold">부서별 예산 현황</CardTitle>
            <CardDescription>각 부서의 예산 대비 실제 집행 금액</CardDescription>
          </div>
          <div className="flex gap-2">
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
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217, 91%, 48%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(217, 91%, 38%)" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(142, 71%, 35%)" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="department" 
              stroke="hsl(var(--foreground))"
              fontSize={12}
              tickFormatter={(value) => value.replace(' Core', '').replace(' Group', '')}
            />
            <YAxis 
              stroke="hsl(var(--foreground))"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
            <Bar dataKey="budget" fill="url(#budgetGradient)" name="예산" radius={[8, 8, 0, 0]} />
            <Bar dataKey="actual" fill="url(#actualGradient)" name="실제" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
    <ChartDetailDialog
      open={showDetail}
      onOpenChange={setShowDetail}
      title="부서별 예산 현황"
      data={data}
      columns={[
        { key: "department", label: "부서", format: (v) => shortenDepartmentName(v) },
        { key: "budget", label: "예산", format: formatCurrency },
        { key: "actual", label: "실제 집행", format: formatCurrency },
        { key: "executionRate", label: "집행률", format: (v) => `${v.toFixed(1)}%` },
        { key: "remaining", label: "잔여 예산", format: formatCurrency },
      ]}
    />
    </>
  );
}
