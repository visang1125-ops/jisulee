import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import { formatCurrency, getExecutionRateColor, shortenDepartmentName } from "@/lib/utils";
import type { BudgetEntry } from "@/hooks/useBudgetData";
import type { SortField } from "@/lib/types";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import SortIcon from "@/components/SortIcon";
import { API_CONSTANTS } from "@/lib/constants-api";

export type BudgetTableEntry = BudgetEntry;

interface BudgetDataTableProps {
  data: BudgetTableEntry[];
  onDownloadCSV?: () => void;
}

export default function BudgetDataTable({ data, onDownloadCSV }: BudgetDataTableProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = API_CONSTANTS.DEFAULT_PAGE_SIZE;
  
  const { sortField, sortDirection, handleSort } = useTableSort();

  // 검색 필터링
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();
    return data.filter(entry => 
      entry.department.toLowerCase().includes(query) ||
      entry.accountCategory.toLowerCase().includes(query) ||
      entry.projectName.toLowerCase().includes(query) ||
      entry.calculationBasis.toLowerCase().includes(query) ||
      entry.businessDivision.toLowerCase().includes(query) ||
      entry.costType.toLowerCase().includes(query) ||
      (entry.isWithinBudget ? "예산내" : "예산외").includes(query) ||
      entry.month.toString().includes(query) ||
      entry.year.toString().includes(query) ||
      formatCurrency(entry.budgetAmount).toLowerCase().includes(query) ||
      formatCurrency(entry.actualAmount).toLowerCase().includes(query) ||
      entry.executionRate.toFixed(1).includes(query)
    );
  }, [data, searchQuery]);

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
  const { currentPage, totalPages, startIndex, paginatedData, setCurrentPage } = usePagination(sortedData, itemsPerPage);

  // 검색어 변경 시 첫 페이지로 (useCallback으로 최적화)
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const getExecutionRateBadge = (rate: number) => {
    return <Badge className={`${getExecutionRateColor(rate)} hover:opacity-90 text-white text-xs`}>{rate.toFixed(1)}%</Badge>;
  };


  const handleDownload = async () => {
    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onDownloadCSV?.();
    setIsDownloading(false);
  };

  return (
    <Card className="shadow-lg" data-testid="card-budget-table">
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-card-foreground/5 to-transparent rounded-t-lg" />
      <CardHeader className="flex flex-col gap-4 space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold">지출 내역</CardTitle>
            <CardDescription>부서별 계정과목 지출 상세</CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-2 min-h-[44px] self-start sm:self-auto"
            data-testid="button-download-csv"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isDownloading ? "다운로드 중..." : "CSV 다운로드"}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="부서, 계정과목, 산정근거/집행내역, 월, 금액 등으로 검색..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10 min-h-[44px]"
            aria-label="테이블 검색"
            aria-describedby="search-description"
          />
          <span id="search-description" className="sr-only">
            테이블의 부서, 계정과목, 산정근거/집행내역, 월, 금액 등으로 검색할 수 있습니다
          </span>
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSearchChange("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              aria-label="검색어 지우기"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
            {filteredData.length}개 항목 검색됨 (전체 {data.length}개)
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort("department")}
                    className="gap-1 min-h-[44px] font-medium"
                    data-testid="button-sort-department"
                    aria-label={`부서로 정렬, 현재 ${sortField === "department" ? (sortDirection === "asc" ? "오름차순" : sortDirection === "desc" ? "내림차순" : "정렬 안 됨") : "정렬 안 됨"}`}
                  >
                    부서
                    <SortIcon field="department" sortField={sortField} sortDirection={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort("accountCategory")}
                    className="gap-1 min-h-[44px] font-medium"
                    data-testid="button-sort-account"
                  >
                    계정과목
                    <SortIcon field="accountCategory" sortField={sortField} sortDirection={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead className="hidden xl:table-cell">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort("isWithinBudget")}
                    className="gap-1 min-h-[44px] font-medium"
                  >
                    예산 내/외
                    <SortIcon field="isWithinBudget" sortField={sortField} sortDirection={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead className="hidden xl:table-cell">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort("businessDivision")}
                    className="gap-1 min-h-[44px] font-medium"
                  >
                    사업구분
                    <SortIcon field="businessDivision" sortField={sortField} sortDirection={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead className="hidden 2xl:table-cell">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort("projectName")}
                    className="gap-1 min-h-[44px] font-medium"
                  >
                    프로젝트명
                    <SortIcon field="projectName" sortField={sortField} sortDirection={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort("month")}
                    className="gap-1 min-h-[44px] font-medium"
                    data-testid="button-sort-month"
                  >
                    월
                    <SortIcon field="month" sortField={sortField} sortDirection={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort("budgetAmount")}
                    className="gap-1 min-h-[44px] font-medium"
                    data-testid="button-sort-budget"
                  >
                    예산
                    <SortIcon field="budgetAmount" sortField={sortField} sortDirection={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort("actualAmount")}
                    className="gap-1 min-h-[44px] font-medium"
                    data-testid="button-sort-actual"
                  >
                    실제
                    <SortIcon field="actualAmount" sortField={sortField} sortDirection={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort("executionRate")}
                    className="gap-1 min-h-[44px] font-medium"
                    data-testid="button-sort-execution"
                  >
                    집행률
                    <SortIcon field="executionRate" sortField={sortField} sortDirection={sortDirection} />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((entry) => (
                <TableRow key={entry.id} className="min-h-[56px]" data-testid={`row-budget-${entry.id}`}>
                  <TableCell className="font-medium py-3">{shortenDepartmentName(entry.department)}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell py-3">{entry.accountCategory}</TableCell>
                  <TableCell className="hidden xl:table-cell py-3">
                    <Badge variant={entry.isWithinBudget ? "default" : "destructive"} className="text-xs">
                      {entry.isWithinBudget ? "예산 내" : "예산 외"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell py-3 text-sm">{entry.businessDivision}</TableCell>
                  <TableCell className="hidden 2xl:table-cell py-3 text-sm max-w-[150px] truncate" title={entry.projectName}>
                    {entry.projectName}
                  </TableCell>
                  <TableCell className="py-3">{entry.month}월</TableCell>
                  <TableCell className="text-right font-mono hidden sm:table-cell py-3">{formatCurrency(entry.budgetAmount)}</TableCell>
                  <TableCell className="text-right font-mono py-3">{formatCurrency(entry.actualAmount)}</TableCell>
                  <TableCell className="text-right py-3">{getExecutionRateBadge(entry.executionRate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} / {sortedData.length}개 항목
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="min-h-[44px] min-w-[44px]"
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-[80px] text-center">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="min-h-[44px] min-w-[44px]"
              data-testid="button-next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
