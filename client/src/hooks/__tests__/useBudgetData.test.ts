import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useBudgetData, buildQueryString, aggregateByDepartment, aggregateByAccount, calculateStats, type FilterState } from "../useBudgetData";
import type { BudgetEntry } from "../useBudgetData";

// Mock fetch
global.fetch = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("buildQueryString", () => {
  it("should build empty string for undefined filters", () => {
    expect(buildQueryString(undefined)).toBe("");
  });

  it("should build query string with all filters", () => {
    const filters: FilterState = {
      startMonth: 1,
      endMonth: 12,
      year: 2025,
      departments: ["DX전략 Core Group"],
      accountCategories: ["통신비"],
    };
    const result = buildQueryString(filters);
    expect(result).toContain("startMonth=1");
    expect(result).toContain("endMonth=12");
    expect(result).toContain("year=2025");
    expect(result).toContain("departments=DX");
    expect(result).toContain("accountCategories=%ED%86%B5%EC%8B%A0%EB%B9%84");
  });
});

describe("aggregateByDepartment", () => {
  it("should aggregate entries by department", () => {
    const data: BudgetEntry[] = [
      {
        id: "1",
        department: "DX전략 Core Group",
        accountCategory: "통신비",
        month: 1,
        year: 2025,
        budgetAmount: 1000000,
        actualAmount: 500000,
        executionRate: 50,
      },
      {
        id: "2",
        department: "DX전략 Core Group",
        accountCategory: "통신비",
        month: 2,
        year: 2025,
        budgetAmount: 2000000,
        actualAmount: 1000000,
        executionRate: 50,
      },
      {
        id: "3",
        department: "서비스혁신 Core",
        accountCategory: "통신비",
        month: 1,
        year: 2025,
        budgetAmount: 1500000,
        actualAmount: 750000,
        executionRate: 50,
      },
    ];

    const result = aggregateByDepartment(data);
    expect(result).toHaveLength(2);
    expect(result[0].department).toBe("DX전략 Core Group");
    expect(result[0].budget).toBe(3000000);
    expect(result[0].actual).toBe(1500000);
    expect(result[0].executionRate).toBe(50);
  });

  it("should handle empty array", () => {
    expect(aggregateByDepartment([])).toEqual([]);
  });
});

describe("aggregateByAccount", () => {
  it("should aggregate entries by account category", () => {
    const data: BudgetEntry[] = [
      {
        id: "1",
        department: "DX전략 Core Group",
        accountCategory: "통신비",
        month: 1,
        year: 2025,
        budgetAmount: 1000000,
        actualAmount: 500000,
        executionRate: 50,
      },
      {
        id: "2",
        department: "서비스혁신 Core",
        accountCategory: "통신비",
        month: 1,
        year: 2025,
        budgetAmount: 2000000,
        actualAmount: 1000000,
        executionRate: 50,
      },
    ];

    const result = aggregateByAccount(data);
    expect(result).toHaveLength(1);
    expect(result[0].accountCategory).toBe("통신비");
    expect(result[0].budget).toBe(3000000);
    expect(result[0].actual).toBe(1500000);
  });
});

describe("calculateStats", () => {
  it("should calculate statistics correctly", () => {
    const data: BudgetEntry[] = [
      {
        id: "1",
        department: "DX전략 Core Group",
        accountCategory: "통신비",
        month: 1,
        year: 2025,
        budgetAmount: 1000000,
        actualAmount: 500000,
        executionRate: 50,
      },
      {
        id: "2",
        department: "DX전략 Core Group",
        accountCategory: "통신비",
        month: 9,
        year: 2025,
        budgetAmount: 2000000,
        actualAmount: 1000000,
        executionRate: 50,
      },
      {
        id: "3",
        department: "DX전략 Core Group",
        accountCategory: "통신비",
        month: 10,
        year: 2025,
        budgetAmount: 1000000,
        actualAmount: 0,
        executionRate: 0,
      },
    ];

    const stats = calculateStats(data, 9);
    expect(stats.annualTotalBudget).toBe(4000000);
    expect(stats.filteredTotalBudget).toBe(4000000);
    expect(stats.filteredTotalActual).toBe(1500000);
    expect(stats.executionRate).toBe(50); // 1500000 / 3000000 * 100
    expect(stats.projectedAnnual).toBeCloseTo(2000000); // 1500000 + (1000000 * 0.5)
  });
});

describe("useBudgetData", () => {
  it("should fetch budget data successfully", async () => {
    const mockData: BudgetEntry[] = [
      {
        id: "1",
        department: "DX전략 Core Group",
        accountCategory: "통신비",
        month: 1,
        year: 2025,
        budgetAmount: 1000000,
        actualAmount: 500000,
        executionRate: 50,
      },
    ];

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useBudgetData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it("should handle fetch errors", async () => {
    (fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useBudgetData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});


