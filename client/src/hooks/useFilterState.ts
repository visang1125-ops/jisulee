import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "wouter";
import { DEFAULT_FILTERS } from "@/lib/constants";
import type { FilterState } from "./useBudgetData";

/**
 * URL과 동기화된 필터 상태 관리 훅
 */
export function useFilterState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => {
    // URL에서 필터 상태 복원
    const params = new URLSearchParams(searchParams);
    const startMonth = params.get("startMonth");
    const endMonth = params.get("endMonth");
    const year = params.get("year");
    const departments = params.getAll("departments");
    const accountCategories = params.getAll("accountCategories");

    const parsedStartMonth = startMonth ? parseInt(startMonth, 10) : null;
    const parsedEndMonth = endMonth ? parseInt(endMonth, 10) : null;
    const parsedYear = year ? parseInt(year, 10) : null;

    return {
      startMonth: (parsedStartMonth && !isNaN(parsedStartMonth) && parsedStartMonth >= 1 && parsedStartMonth <= 12) 
        ? parsedStartMonth 
        : DEFAULT_FILTERS.startMonth,
      endMonth: (parsedEndMonth && !isNaN(parsedEndMonth) && parsedEndMonth >= 1 && parsedEndMonth <= 12) 
        ? parsedEndMonth 
        : DEFAULT_FILTERS.endMonth,
      year: (parsedYear && !isNaN(parsedYear) && parsedYear >= 2020 && parsedYear <= 2030) 
        ? parsedYear 
        : DEFAULT_FILTERS.year,
      departments: departments.length > 0 ? departments : DEFAULT_FILTERS.departments,
      accountCategories: accountCategories.length > 0 ? accountCategories : DEFAULT_FILTERS.accountCategories,
    };
  });

  // 필터 변경 시 URL 업데이트
  const updateFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.startMonth !== DEFAULT_FILTERS.startMonth) {
      params.set("startMonth", newFilters.startMonth.toString());
    }
    if (newFilters.endMonth !== DEFAULT_FILTERS.endMonth) {
      params.set("endMonth", newFilters.endMonth.toString());
    }
    if (newFilters.year !== DEFAULT_FILTERS.year) {
      params.set("year", newFilters.year.toString());
    }
    newFilters.departments.forEach(dept => {
      params.append("departments", dept);
    });
    newFilters.accountCategories.forEach(cat => {
      params.append("accountCategories", cat);
    });
    setSearchParams(params);
  }, [setSearchParams]);

  // URL 변경 시 필터 동기화
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const startMonth = params.get("startMonth");
    const endMonth = params.get("endMonth");
    const year = params.get("year");
    const departments = params.getAll("departments");
    const accountCategories = params.getAll("accountCategories");

    const parsedStartMonth = startMonth ? parseInt(startMonth, 10) : null;
    const parsedEndMonth = endMonth ? parseInt(endMonth, 10) : null;
    const parsedYear = year ? parseInt(year, 10) : null;

    setFilters({
      startMonth: (parsedStartMonth && !isNaN(parsedStartMonth) && parsedStartMonth >= 1 && parsedStartMonth <= 12) 
        ? parsedStartMonth 
        : DEFAULT_FILTERS.startMonth,
      endMonth: (parsedEndMonth && !isNaN(parsedEndMonth) && parsedEndMonth >= 1 && parsedEndMonth <= 12) 
        ? parsedEndMonth 
        : DEFAULT_FILTERS.endMonth,
      year: (parsedYear && !isNaN(parsedYear) && parsedYear >= 2020 && parsedYear <= 2030) 
        ? parsedYear 
        : DEFAULT_FILTERS.year,
      departments: departments.length > 0 ? departments : DEFAULT_FILTERS.departments,
      accountCategories: accountCategories.length > 0 ? accountCategories : DEFAULT_FILTERS.accountCategories,
    });
  }, [searchParams]);

  const resetFilters = useCallback(() => {
    updateFilters({ ...DEFAULT_FILTERS });
  }, [updateFilters]);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}

