import { describe, it, expect } from "vitest";
import { formatCurrency, formatShortCurrency, getExecutionRateColor, shortenDepartmentName, shortenAccountName } from "../utils";

describe("formatCurrency", () => {
  it("should format small numbers correctly", () => {
    expect(formatCurrency(1000)).toContain("1,000");
    expect(formatCurrency(50000)).toContain("50,000");
  });

  it("should format large numbers correctly", () => {
    expect(formatCurrency(1000000)).toContain("1,000,000");
    expect(formatCurrency(50000000)).toContain("50,000,000");
  });

  it("should handle zero", () => {
    expect(formatCurrency(0)).toContain("0");
  });
});

describe("formatShortCurrency", () => {
  it("should format large numbers in millions correctly", () => {
    expect(formatShortCurrency(1000000000)).toBe("1,000백만원");
    expect(formatShortCurrency(2500000000)).toBe("2,500백만원");
    expect(formatShortCurrency(1500000000)).toBe("1,500백만원");
  });

  it("should format millions correctly", () => {
    expect(formatShortCurrency(1000000)).toBe("1백만원");
    expect(formatShortCurrency(50000000)).toBe("50백만원");
    expect(formatShortCurrency(15000000)).toBe("15백만원");
  });

  it("should format thousands correctly", () => {
    expect(formatShortCurrency(1000)).toBe("1천원");
    expect(formatShortCurrency(50000)).toBe("50천원");
  });

  it("should handle numbers less than 1000", () => {
    expect(formatShortCurrency(500)).toBe("500원");
    expect(formatShortCurrency(0)).toBe("0원");
  });
});

describe("getExecutionRateColor", () => {
  it("should return red for rates >= 90", () => {
    expect(getExecutionRateColor(90)).toBe("bg-red-500");
    expect(getExecutionRateColor(95)).toBe("bg-red-500");
    expect(getExecutionRateColor(100)).toBe("bg-red-500");
  });

  it("should return amber for rates >= 70 and < 90", () => {
    expect(getExecutionRateColor(70)).toBe("bg-amber-500");
    expect(getExecutionRateColor(80)).toBe("bg-amber-500");
    expect(getExecutionRateColor(89.9)).toBe("bg-amber-500");
  });

  it("should return green for rates < 70", () => {
    expect(getExecutionRateColor(69.9)).toBe("bg-green-500");
    expect(getExecutionRateColor(50)).toBe("bg-green-500");
    expect(getExecutionRateColor(0)).toBe("bg-green-500");
  });
});

describe("shortenDepartmentName", () => {
  it("should remove ' Core' suffix", () => {
    expect(shortenDepartmentName("서비스혁신 Core")).toBe("서비스혁신");
  });

  it("should remove ' Group' suffix", () => {
    expect(shortenDepartmentName("DX전략 Core Group")).toBe("DX전략 Core");
  });

  it("should remove both suffixes", () => {
    expect(shortenDepartmentName("DX전략 Core Group")).toBe("DX전략 Core");
  });

  it("should return unchanged if no suffix", () => {
    expect(shortenDepartmentName("일반부서")).toBe("일반부서");
  });
});

describe("shortenAccountName", () => {
  it("should remove parentheses and content", () => {
    expect(shortenAccountName("지급수수료(은행수수료)")).toBe("수수료은행수수료");
  });

  it("should replace '지급수수료' with '수수료'", () => {
    expect(shortenAccountName("지급수수료")).toBe("수수료");
  });

  it("should handle complex names", () => {
    expect(shortenAccountName("지급수수료(외부용역,자문료)")).toBe("수수료외부용역,자문료");
  });

  it("should return unchanged if no pattern matches", () => {
    expect(shortenAccountName("통신비")).toBe("통신비");
  });
});

