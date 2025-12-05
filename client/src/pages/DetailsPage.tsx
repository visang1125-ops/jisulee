import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, Download } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";
import TableSkeleton from "@/components/TableSkeleton";
import { useBudgetData, type FilterState, type BudgetEntry } from "@/hooks/useBudgetData";
import { formatCurrency, getExecutionRateColor, shortenDepartmentName } from "@/lib/utils";
import { sumBy } from "@/utils/calculations";
import type { SortField } from "@/lib/types";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import SortIcon from "@/components/SortIcon";
import { downloadCSV } from "@/utils/csv-export";
import { API_CONSTANTS } from "@/lib/constants-api";

interface DetailsPageProps {
  filters?: FilterState;
}

export default function DetailsPage({ filters }: DetailsPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(API_CONSTANTS.DEFAULT_PAGE_SIZE * 2);
  
  const { sortField, sortDirection, handleSort } = useTableSort();

  const { data: budgetData = [], isLoading, isError, error, refetch } = useBudgetData(filters);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <TableSkeleton rows={10} columns={7} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            상세 내역
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // 검색 필터링 (메모이제이션)
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return budgetData;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return budgetData.filter(item => 
      item.department.toLowerCase().includes(lowerSearchTerm) ||
      item.accountCategory.toLowerCase().includes(lowerSearchTerm) ||
      item.calculationBasis.toLowerCase().includes(lowerSearchTerm)
    );
  }, [budgetData, searchTerm]);

  // 정렬 (메모이제이션)
  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField as keyof BudgetEntry];
      const bValue = b[sortField as keyof BudgetEntry];
      const modifier = sortDirection === "asc" ? 1 : -1;
      if (aValue < bValue) return -1 * modifier;
      if (aValue > bValue) return 1 * modifier;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // 페이지네이션
  const { currentPage, totalPages, startIndex, paginatedData, setCurrentPage } = usePagination(sortedData, pageSize);
  
  // 정렬 변경 시 첫 페이지로
  const handleSortWithReset = useCallback((field: SortField) => {
    handleSort(field);
    setCurrentPage(1);
  }, [handleSort, setCurrentPage]);


  const handleDownloadCSV = () => {
    const headers = ["부서", "계정과목", "월", "연도", "예산", "실제 집행", "집행률"];
    const csvData = sortedData.map(entry => [
      entry.department,
      entry.accountCategory,
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
    link.download = `budget_details_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // 총계 계산 (메모이제이션)
  const { totalBudget, totalActual } = useMemo(() => {
    const budget = sumBy(sortedData, (item) => item.budgetAmount);
    const actual = sumBy(sortedData, (item) => item.actualAmount);
    return { totalBudget: budget, totalActual: actual };
  }, [sortedData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          상세 내역
        </h1>
        <p className="text-muted-foreground mt-1">
          전체 예산 및 집행 데이터를 상세히 조회합니다
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">전체 항목</div>
            <div className="text-2xl font-bold">{sortedData.length.toLocaleString()}건</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">총 예산</div>
            <div className="text-2xl font-bold font-mono">{formatCurrency(totalBudget)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">총 집행</div>
            <div className="text-2xl font-bold font-mono">{formatCurrency(totalActual)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 테이블 */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>전체 데이터</CardTitle>
              <CardDescription>
                {searchTerm ? `검색 결과: ${sortedData.length}건` : `총 ${sortedData.length}건의 데이터`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="검색..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select 
                value={pageSize.toString()} 
                onValueChange={(v) => {
                  const size = parseInt(v, 10);
                  if (!isNaN(size) && size > 0 && size <= 1000) {
                    setPageSize(size);
                    setCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10개</SelectItem>
                  <SelectItem value="20">20개</SelectItem>
                  <SelectItem value="50">50개</SelectItem>
                  <SelectItem value="100">100개</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleDownloadCSV} className="gap-2">
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("department")} className="gap-1">
                      부서 <SortIcon field="department" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("accountCategory")} className="gap-1">
                      계정과목 <SortIcon field="accountCategory" sortField={sortField} sortDirection={sortDirection} />
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button variant="ghost" size="sm" onClick={() => handleSort("calculationBasis")} className="gap-1">
                      산정근거/집행내역 <SortIcon field="calculationBasis" sortField={sortField} sortDirection={sortDirection} />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("month")} className="gap-1">
                      월 <SortIcon field="month" sortField={sortField} sortDirection={sortDirection} />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleSort("budgetAmount")} className="gap-1">
                      예산 <SortIcon field="budgetAmount" sortField={sortField} sortDirection={sortDirection} />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleSort("actualAmount")} className="gap-1">
                      실제 <SortIcon field="actualAmount" sortField={sortField} sortDirection={sortDirection} />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleSort("executionRate")} className="gap-1">
                      집행률 <SortIcon field="executionRate" sortField={sortField} sortDirection={sortDirection} />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{shortenDepartmentName(entry.department)}</TableCell>
                    <TableCell>{entry.accountCategory}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate" title={entry.calculationBasis}>{entry.calculationBasis}</TableCell>
                    <TableCell>{entry.month}월</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(entry.budgetAmount)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(entry.actualAmount)}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={getExecutionRateColor(entry.executionRate)}>
                        {entry.executionRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="text-sm text-muted-foreground">
              {startIndex + 1}-{Math.min(startIndex + pageSize, sortedData.length)} / {sortedData.length}개
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                ««
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {currentPage} / {totalPages || 1}
              </span>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                »»
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
