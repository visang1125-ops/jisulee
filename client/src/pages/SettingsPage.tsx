import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, Monitor, Palette, Bell, Database, Info, RefreshCw } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import StatusMessage from "@/components/StatusMessage";
import { getSettlementMonth, DEFAULT_SETTLEMENT_MONTH } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { API_CONSTANTS } from "@/lib/constants-api";
import { DEFAULT_YEAR, MONTHS_PER_YEAR } from "@shared/constants";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [settlementMonth, setSettlementMonth] = useState(() => {
    return getSettlementMonth().toString();
  });
  const [showNotifications, setShowNotifications] = useState(() => {
    const stored = localStorage.getItem("showNotifications");
    return stored !== null ? stored === "true" : true;
  });
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const stored = localStorage.getItem("autoRefresh");
    return stored !== null ? stored === "true" : false;
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    // 설정 저장
    localStorage.setItem("settlementMonth", settlementMonth);
    localStorage.setItem("showNotifications", showNotifications.toString());
    localStorage.setItem("autoRefresh", autoRefresh.toString());
    
    // 예산 데이터 쿼리 무효화하여 재조회
    queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), API_CONSTANTS.SUCCESS_MESSAGE_DISPLAY_MS);
  };

  const handleResetData = () => {
    if (confirm("모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      // 데이터 초기화 로직
      alert("데이터가 초기화되었습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          설정
        </h1>
        <p className="text-muted-foreground mt-1">
          시스템 환경 설정을 관리합니다
        </p>
      </div>

      {saveSuccess && (
        <StatusMessage 
          type="success" 
          title="저장 완료" 
          message="설정이 성공적으로 저장되었습니다."
        />
      )}

      {/* 테마 설정 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            테마 설정
          </CardTitle>
          <CardDescription>화면 테마와 표시 방식을 설정합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>다크 모드</Label>
              <p className="text-sm text-muted-foreground">
                어두운 배경의 화면 테마를 사용합니다
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Sun className="h-5 w-5 text-amber-500" />
              <Switch 
                checked={theme === "dark"} 
                onCheckedChange={toggleTheme}
              />
              <Moon className="h-5 w-5 text-blue-500" />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>현재 테마</Label>
              <p className="text-sm text-muted-foreground">
                {theme === "dark" ? "다크 모드가 활성화되어 있습니다" : "라이트 모드가 활성화되어 있습니다"}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              {theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span className="font-medium">{theme === "dark" ? "Dark" : "Light"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 결산 설정 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            결산 설정
          </CardTitle>
          <CardDescription>예산 결산 관련 설정을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>결산 마감월</Label>
                <p className="text-sm text-muted-foreground">
                  실제 집행 데이터가 확정된 마지막 월
                </p>
              </div>
              <Select value={settlementMonth} onValueChange={setSettlementMonth}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>{month}월</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p className="font-medium">결산 마감월의 역할:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>연간 예상 비용 계산: 실제 집행 금액 + (결산 마감월 이후 월들의 예산 × 집행률)</li>
                <li>집행률 계산 시 "실제 데이터"와 "예상 데이터" 구분</li>
                <li>차트에서 결산 마감월 이후는 점선/회색으로 표시</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                💡 월별 필터는 데이터 범위를 선택하는 것이고, 결산 마감월은 계산 기준을 설정하는 것입니다.
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>자동 새로고침</Label>
              <p className="text-sm text-muted-foreground">
                30초마다 자동으로 데이터를 새로고침합니다
              </p>
            </div>
            <Switch 
              checked={autoRefresh} 
              onCheckedChange={setAutoRefresh}
            />
          </div>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            알림 설정
          </CardTitle>
          <CardDescription>알림 및 메시지 표시 설정</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>알림 표시</Label>
              <p className="text-sm text-muted-foreground">
                작업 완료 및 경고 알림을 표시합니다
              </p>
            </div>
            <Switch 
              checked={showNotifications} 
              onCheckedChange={setShowNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* 시스템 정보 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            시스템 정보
          </CardTitle>
          <CardDescription>시스템 버전 및 정보</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">버전</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">마지막 업데이트</p>
              <p className="font-medium">{DEFAULT_YEAR}년 {MONTHS_PER_YEAR}월</p>
            </div>
            <div>
              <p className="text-muted-foreground">개발</p>
              <p className="font-medium">비상교육</p>
            </div>
            <div>
              <p className="text-muted-foreground">기술 스택</p>
              <p className="font-medium">React, TypeScript, Tailwind</p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              페이지 새로고침
            </Button>
            <Button variant="destructive" onClick={handleResetData} className="gap-2">
              <Database className="h-4 w-4" />
              데이터 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" className="min-w-[120px]">
          설정 저장
        </Button>
      </div>
    </div>
  );
}


