import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { DEPARTMENTS, ACCOUNT_CATEGORIES } from "@/lib/constants";
import { BUSINESS_DIVISIONS, COST_TYPES, DEFAULT_YEAR, MONTHS_PER_YEAR } from "@shared/constants";
import { API_CONSTANTS } from "@/lib/constants-api";
import { Loader2, Plus, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function SettlementEntryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    department: "",
    accountCategory: "",
    month: "",
    year: "2025",
    projectName: "",
    calculationBasis: "",
    businessDivision: "전체",
    costType: "변동비",
    budgetAmount: "",
    actualAmount: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      // 유효성 검사
      if (!formData.department || !formData.accountCategory || !formData.projectName || 
          !formData.calculationBasis || !formData.month || !formData.year) {
        toast({
          title: "입력 오류",
          description: "필수 항목을 모두 입력해주세요.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const budgetAmount = parseFloat(formData.budgetAmount.replace(/,/g, "")) || 0;
      const actualAmount = parseFloat(formData.actualAmount.replace(/,/g, "")) || 0;

      if (budgetAmount < API_CONSTANTS.MIN_AMOUNT || actualAmount < API_CONSTANTS.MIN_AMOUNT) {
        toast({
          title: "입력 오류",
          description: `금액은 ${API_CONSTANTS.MIN_AMOUNT} 이상이어야 합니다.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const entry = {
        department: formData.department,
        accountCategory: formData.accountCategory,
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        budgetAmount,
        actualAmount,
        isWithinBudget: false, // 결산 내역은 예산 외
        businessDivision: formData.businessDivision,
        projectName: formData.projectName,
        calculationBasis: formData.calculationBasis,
        costType: formData.costType,
      };

      const response = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "결산 내역 추가에 실패했습니다.");
      }

      const result = await response.json();
      
      // 성공 처리
      setIsSuccess(true);
      toast({
        title: "추가 완료",
        description: "결산 내역이 성공적으로 추가되었습니다.",
      });

      // 폼 초기화
      setFormData({
        department: "",
        accountCategory: "",
        month: "",
        year: "2025",
        projectName: "",
        calculationBasis: "",
        businessDivision: "전체",
        costType: "변동비",
        budgetAmount: "",
        actualAmount: "",
      });

      // 데이터 새로고침
      await queryClient.invalidateQueries({ queryKey: ["/api/budget"] });

      setTimeout(() => setIsSuccess(false), API_CONSTANTS.SUCCESS_MESSAGE_DISPLAY_MS);
    } catch (error) {
      toast({
        title: "추가 실패",
        description: error instanceof Error ? error.message : "결산 내역 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (field: "budgetAmount" | "actualAmount", value: string) => {
    // 숫자만 입력 허용
    const numericValue = value.replace(/[^0-9]/g, "");
    setFormData(prev => ({ ...prev, [field]: numericValue }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          결산 내역 추가
        </h1>
        <p className="text-muted-foreground mt-1">
          예산 외 결산 내역을 추가합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>결산 내역 정보</CardTitle>
          <CardDescription>
            예산 외 결산 내역을 입력하세요. 모든 필수 항목을 입력해야 합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 부서 */}
              <div className="space-y-2">
                <Label htmlFor="department">
                  부서 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  required
                >
                  <SelectTrigger id="department" className="min-h-[44px]">
                    <SelectValue placeholder="부서를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 계정과목 */}
              <div className="space-y-2">
                <Label htmlFor="accountCategory">
                  계정과목 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.accountCategory}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, accountCategory: value }))}
                  required
                >
                  <SelectTrigger id="accountCategory" className="min-h-[44px]">
                    <SelectValue placeholder="계정과목을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 연도 */}
              <div className="space-y-2">
                <Label htmlFor="year">
                  연도 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.year}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, year: value }))}
                  required
                >
                  <SelectTrigger id="year" className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024년</SelectItem>
                    <SelectItem value="2025">2025년</SelectItem>
                    <SelectItem value="2026">2026년</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 월 */}
              <div className="space-y-2">
                <Label htmlFor="month">
                  월 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.month}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, month: value }))}
                  required
                >
                  <SelectTrigger id="month" className="min-h-[44px]">
                    <SelectValue placeholder="월을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: MONTHS_PER_YEAR }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>{month}월</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 프로젝트명 */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="projectName">
                  프로젝트명/세부항목 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  placeholder="프로젝트명 또는 세부항목을 입력하세요"
                  className="min-h-[44px]"
                  required
                />
              </div>

              {/* 산정근거/집행내역 */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="calculationBasis">
                  산정근거/집행내역 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="calculationBasis"
                  value={formData.calculationBasis}
                  onChange={(e) => setFormData(prev => ({ ...prev, calculationBasis: e.target.value }))}
                  placeholder="산정근거 또는 집행내역을 입력하세요"
                  className="min-h-[100px]"
                  required
                />
              </div>

              {/* 사업구분 */}
              <div className="space-y-2">
                <Label htmlFor="businessDivision">사업구분</Label>
                <Select
                  value={formData.businessDivision}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, businessDivision: value }))}
                >
                  <SelectTrigger id="businessDivision" className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_DIVISIONS.map(division => (
                      <SelectItem key={division} value={division}>{division}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 고정비/변동비 */}
              <div className="space-y-2">
                <Label htmlFor="costType">고정비/변동비</Label>
                <Select
                  value={formData.costType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, costType: value }))}
                >
                  <SelectTrigger id="costType" className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COST_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 예산 금액 */}
              <div className="space-y-2">
                <Label htmlFor="budgetAmount">예산 금액</Label>
                <Input
                  id="budgetAmount"
                  type="text"
                  value={formData.budgetAmount ? parseInt(formData.budgetAmount).toLocaleString() : ""}
                  onChange={(e) => handleAmountChange("budgetAmount", e.target.value)}
                  placeholder="0"
                  className="min-h-[44px] text-right font-mono"
                />
                {formData.budgetAmount && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(parseFloat(formData.budgetAmount.replace(/,/g, "")) || 0)}
                  </p>
                )}
              </div>

              {/* 실제 금액 */}
              <div className="space-y-2">
                <Label htmlFor="actualAmount">실제 집행 금액</Label>
                <Input
                  id="actualAmount"
                  type="text"
                  value={formData.actualAmount ? parseInt(formData.actualAmount).toLocaleString() : ""}
                  onChange={(e) => handleAmountChange("actualAmount", e.target.value)}
                  placeholder="0"
                  className="min-h-[44px] text-right font-mono"
                />
                {formData.actualAmount && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(parseFloat(formData.actualAmount.replace(/,/g, "")) || 0)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    추가 중...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    추가 완료
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    결산 내역 추가
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                <span className="text-destructive">*</span> 표시된 항목은 필수 입력 항목입니다.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

