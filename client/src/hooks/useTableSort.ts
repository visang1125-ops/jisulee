import { useState, useCallback } from "react";
import type { SortField, SortDirection } from "@/lib/types";

/**
 * 테이블 정렬 훅
 */
export function useTableSort() {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField, sortDirection]);

  const resetSort = useCallback(() => {
    setSortField(null);
    setSortDirection(null);
  }, []);

  return {
    sortField,
    sortDirection,
    handleSort,
    resetSort,
  };
}


