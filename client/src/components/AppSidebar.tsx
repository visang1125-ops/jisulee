import { useState } from "react";
import { 
  LayoutDashboard, 
  BarChart3, 
  PieChart, 
  Table2,
  Settings,
  FileText,
  Filter,
  Calendar,
  Building2,
  FolderOpen,
  RotateCcw,
  Check,
  PlusCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DEPARTMENTS, ACCOUNT_CATEGORIES, DEFAULT_FILTERS, type ViewType } from "@/lib/constants";
import { shortenDepartmentName } from "@/lib/utils";
import type { FilterState } from "@/hooks/useBudgetData";

interface AppSidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onApplyFilters?: (filters: FilterState) => void;
  onResetFilters?: () => void;
  initialFilters?: FilterState;
}

const menuItems: { title: string; icon: typeof LayoutDashboard; view: ViewType }[] = [
  { title: "대시보드", icon: LayoutDashboard, view: "dashboard" },
  { title: "부서별 분석", icon: BarChart3, view: "department" },
  { title: "계정과목별 분석", icon: PieChart, view: "account" },
  { title: "상세 내역", icon: Table2, view: "details" },
  { title: "보고서", icon: FileText, view: "reports" },
  { title: "결산 내역 추가", icon: PlusCircle, view: "settlement" },
  { title: "설정", icon: Settings, view: "settings" },
];

export default function AppSidebar({ currentView, onViewChange, onApplyFilters, onResetFilters, initialFilters }: AppSidebarProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters || DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters || DEFAULT_FILTERS);
  const [isApplying, setIsApplying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 변경된 항목 수 계산
  const countChanges = () => {
    let changes = 0;
    if (filters.startMonth !== appliedFilters.startMonth) changes++;
    if (filters.endMonth !== appliedFilters.endMonth) changes++;
    if (filters.year !== appliedFilters.year) changes++;
    
    // 부서 변경 수
    const deptAdded = filters.departments.filter(d => !appliedFilters.departments.includes(d)).length;
    const deptRemoved = appliedFilters.departments.filter(d => !filters.departments.includes(d)).length;
    changes += deptAdded + deptRemoved;
    
    // 계정과목 변경 수
    const catAdded = filters.accountCategories.filter(c => !appliedFilters.accountCategories.includes(c)).length;
    const catRemoved = appliedFilters.accountCategories.filter(c => !filters.accountCategories.includes(c)).length;
    changes += catAdded + catRemoved;
    
    return changes;
  };

  const changesCount = countChanges();

  const handleDepartmentToggle = (dept: string) => {
    setFilters(prev => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter(d => d !== dept)
        : [...prev.departments, dept],
    }));
  };

  const handleDepartmentSelectAll = () => {
    setFilters(prev => ({ ...prev, departments: [...DEPARTMENTS] }));
  };

  const handleDepartmentDeselectAll = () => {
    setFilters(prev => ({ ...prev, departments: [] }));
  };

  const handleAccountCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      accountCategories: prev.accountCategories.includes(category)
        ? prev.accountCategories.filter(c => c !== category)
        : [...prev.accountCategories, category],
    }));
  };

  const handleAccountSelectAll = () => {
    setFilters(prev => ({ ...prev, accountCategories: [...ACCOUNT_CATEGORIES] }));
  };

  const handleAccountDeselectAll = () => {
    setFilters(prev => ({ ...prev, accountCategories: [] }));
  };

  const handleApply = async () => {
    setIsApplying(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onApplyFilters?.(filters);
    setAppliedFilters(filters);
    setIsApplying(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    onResetFilters?.();
  };

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-base font-bold px-4 py-4 text-primary">
            예산 관리 시스템
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => onViewChange(item.view)}
                    className={`min-h-[44px] cursor-pointer ${currentView === item.view ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
                    data-testid={`link-${item.view}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 px-4 py-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="font-semibold">필터</span>
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-4">
            <ScrollArea className="h-[calc(100vh-400px)] pr-2">
              <div className="space-y-4">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-medium hover:text-primary transition-colors min-h-[44px]">
                    <Calendar className="h-4 w-4" />
                    기간 설정
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pl-6 pt-2">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">연도</Label>
                      <Select 
                        value={filters.year.toString()} 
                        onValueChange={(v) => {
                          const year = parseInt(v, 10);
                          if (!isNaN(year) && year >= 2020 && year <= 2030) {
                            setFilters(prev => ({ ...prev, year }));
                          }
                        }}
                      >
                        <SelectTrigger className="min-h-[44px]" data-testid="select-year">
                          <SelectValue placeholder="연도" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024">2024년</SelectItem>
                          <SelectItem value={String(DEFAULT_YEAR)}>{DEFAULT_YEAR}년</SelectItem>
                          <SelectItem value="2026">2026년</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">시작</Label>
                        <Select 
                          value={filters.startMonth.toString()} 
                          onValueChange={(v) => {
                            const month = parseInt(v, 10);
                            if (!isNaN(month) && month >= 1 && month <= 12) {
                              setFilters(prev => ({ ...prev, startMonth: month }));
                            }
                          }}
                        >
                          <SelectTrigger className="min-h-[44px]" data-testid="select-start-month">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <SelectItem key={month} value={month.toString()}>{month}월</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">종료</Label>
                        <Select 
                          value={filters.endMonth.toString()} 
                          onValueChange={(v) => {
                            const month = parseInt(v, 10);
                            if (!isNaN(month) && month >= 1 && month <= 12) {
                              setFilters(prev => ({ ...prev, endMonth: month }));
                            }
                          }}
                        >
                          <SelectTrigger className="min-h-[44px]" data-testid="select-end-month">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <SelectItem key={month} value={month.toString()}>{month}월</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger 
                    className="flex items-center gap-2 w-full py-2 text-sm font-medium hover:text-primary transition-colors min-h-[44px]"
                    aria-label={`부서 필터, ${filters.departments.length}개 선택됨`}
                  >
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                    부서
                    <span className="ml-auto text-xs text-muted-foreground" aria-label={`${filters.departments.length}개 중 ${DEPARTMENTS.length}개 선택됨`}>
                      {filters.departments.length}/{DEPARTMENTS.length}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pl-6 pt-2">
                    <div className="flex gap-2 mb-2" role="group" aria-label="부서 필터 옵션">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDepartmentSelectAll}
                        className="text-xs h-7 px-2"
                        aria-label="모든 부서 선택"
                      >
                        전체선택
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDepartmentDeselectAll}
                        className="text-xs h-7 px-2"
                        aria-label="모든 부서 선택 해제"
                      >
                        전체해제
                      </Button>
                    </div>
                    {DEPARTMENTS.map(dept => (
                      <div key={dept} className="flex items-center gap-3 min-h-[36px]">
                        <Checkbox 
                          id={dept}
                          checked={filters.departments.includes(dept)}
                          onCheckedChange={() => handleDepartmentToggle(dept)}
                          className="h-5 w-5"
                          data-testid={`checkbox-dept-${dept}`}
                          aria-label={`${shortenDepartmentName(dept)} ${filters.departments.includes(dept) ? '선택됨' : '선택 안 됨'}`}
                        />
                        <label htmlFor={dept} className="text-sm cursor-pointer flex-1 leading-tight">
                          {shortenDepartmentName(dept)}
                        </label>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger 
                    className="flex items-center gap-2 w-full py-2 text-sm font-medium hover:text-primary transition-colors min-h-[44px]"
                    aria-label={`계정과목 필터, ${filters.accountCategories.length}개 선택됨`}
                  >
                    <FolderOpen className="h-4 w-4" aria-hidden="true" />
                    계정과목
                    <span className="ml-auto text-xs text-muted-foreground" aria-label={`${filters.accountCategories.length}개 중 ${ACCOUNT_CATEGORIES.length}개 선택됨`}>
                      {filters.accountCategories.length}/{ACCOUNT_CATEGORIES.length}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pl-6 pt-2">
                    <div className="flex gap-2 mb-2" role="group" aria-label="계정과목 필터 옵션">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAccountSelectAll}
                        className="text-xs h-7 px-2"
                        aria-label="모든 계정과목 선택"
                      >
                        전체선택
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAccountDeselectAll}
                        className="text-xs h-7 px-2"
                        aria-label="모든 계정과목 선택 해제"
                      >
                        전체해제
                      </Button>
                    </div>
                    {ACCOUNT_CATEGORIES.map(category => (
                      <div key={category} className="flex items-center gap-3 min-h-[36px]">
                        <Checkbox 
                          id={category}
                          checked={filters.accountCategories.includes(category)}
                          onCheckedChange={() => handleAccountCategoryToggle(category)}
                          className="h-5 w-5"
                          data-testid={`checkbox-category-${category}`}
                        />
                        <label htmlFor={category} className="text-sm cursor-pointer flex-1 leading-tight">
                          {category}
                        </label>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-4 pb-2">
              <Button 
                onClick={handleApply} 
                className="flex-1 gap-2 min-h-[44px] font-medium"
                disabled={isApplying || changesCount === 0}
                data-testid="button-apply-filters"
              >
                {isApplying ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : showSuccess ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
                {isApplying ? "적용 중..." : showSuccess ? "완료" : changesCount > 0 ? `적용(${changesCount})` : "적용"}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleReset}
                className="min-h-[44px] min-w-[44px]"
                data-testid="button-reset-filters"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
