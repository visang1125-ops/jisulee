import { useState, useMemo, useCallback } from "react";

/**
 * 페이지네이션 훅
 */
export function usePagination<T>(
  data: T[],
  itemsPerPage: number = 10
) {
  const [currentPage, setCurrentPage] = useState(1);

  const { totalPages, startIndex, paginatedData } = useMemo(() => {
    const total = Math.ceil(data.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = data.slice(start, start + itemsPerPage);
    return { totalPages: total, startIndex: start, paginatedData: paginated };
  }, [data, itemsPerPage, currentPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  return {
    currentPage,
    totalPages,
    startIndex,
    paginatedData,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
    setCurrentPage,
  };
}


