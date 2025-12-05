import React, { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
  X,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS, ACCOUNT_CATEGORIES } from "@/lib/constants";
import { BUSINESS_DIVISIONS, COST_TYPES } from "@shared/constants";
import { isValidDepartment, isValidAccountCategory, isValidBusinessDivision, isValidCostType, isValidType, isBudgetType, isActualType } from "@/lib/validation";
import { groupEntriesByKey, createEntryKey } from "@shared/excel-utils";

interface PreviewEntry {
  row: number;
  department: string;
  accountCategory: string;
  month: number;
  year: number;
  type: string; // 구분: "예산" 또는 "실제"
  amount: number; // 금액
  // 새로운 필드들
  isWithinBudget?: boolean; // 예산 내/외 (기본값: true)
  businessDivision?: string; // 사업구분
  projectName: string; // 프로젝트명/세부항목 (필수)
  calculationBasis: string; // 산정근거/집행내역 (필수)
  costType?: string; // 고정비/변동비
  isValid: boolean;
  errors: string[];
  // 서버 전송용 (같은 키로 그룹화된 후)
  budgetAmount?: number;
  actualAmount?: number;
}

interface ValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  entries: PreviewEntry[];
  errors: { row: number; message: string }[];
}

interface ImportPreviewDialogProps {
  onImport: (entries: PreviewEntry[]) => Promise<void>;
  trigger?: React.ReactNode;
}

export default function ImportPreviewDialog({ onImport, trigger }: ImportPreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseCSV = useCallback((text: string): PreviewEntry[] => {
    const lines = text.split("\n").filter(line => line.trim());
    const entries: PreviewEntry[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = parseCSVLine(line);
      
      // 최소 6개 필드 필요 (부서, 계정과목, 월, 연도, 구분, 금액)
      if (values.length < 6) continue;
      
      const entry: PreviewEntry = {
        row: i + 1,
        department: values[0]?.replace(/"/g, "").trim() || "",
        accountCategory: values[1]?.replace(/"/g, "").trim() || "",
        month: parseInt(values[2]) || 0,
        year: parseInt(values[3]) || 0,
        type: values[4]?.replace(/"/g, "").trim() || "", // 구분: 예산 또는 실제
        amount: parseFloat(values[5]?.replace(/"/g, "").replace(/,/g, '')) || 0,
        // 새 필드들 (선택적, 기본값 제공)
        isWithinBudget: values[6] ? values[6].replace(/"/g, "").trim().toLowerCase() === "예산내" || values[6].replace(/"/g, "").trim().toLowerCase() === "true" : true,
        businessDivision: values[7]?.replace(/"/g, "").trim() || "전체",
        projectName: values[8]?.replace(/"/g, "").trim() || "", // 프로젝트명 (필수)
        calculationBasis: values[9]?.replace(/"/g, "").trim() || "", // 산정근거/집행내역 (필수)
        costType: values[10]?.replace(/"/g, "").trim() || "변동비",
        isValid: true,
        errors: [],
      };
      
      // Validate entry
      validateEntry(entry);
      entries.push(entry);
    }
    
    return entries;
  }, []);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const validateEntry = (entry: PreviewEntry) => {
    entry.errors = [];
    
    if (!entry.department) {
      entry.errors.push("부서가 비어있습니다");
    } else if (!isValidDepartment(entry.department)) {
      entry.errors.push(`유효하지 않은 부서: ${entry.department}`);
    }
    
    if (!entry.accountCategory) {
      entry.errors.push("계정과목이 비어있습니다");
    } else if (!isValidAccountCategory(entry.accountCategory)) {
      entry.errors.push(`유효하지 않은 계정과목: ${entry.accountCategory}`);
    }
    
    if (!entry.projectName || entry.projectName.trim() === "") {
      entry.errors.push("프로젝트명이 비어있습니다");
    }
    
    if (!entry.calculationBasis || entry.calculationBasis.trim() === "") {
      entry.errors.push("산정근거/집행내역이 비어있습니다");
    }
    
    if (!entry.type || entry.type.trim() === "") {
      entry.errors.push("구분이 비어있습니다 (예산 또는 실제)");
    } else if (!isValidType(entry.type)) {
      entry.errors.push(`구분이 유효하지 않습니다. "예산", "계획", "실제", "집행" 중 하나여야 합니다. (현재: "${entry.type.trim()}")`);
    }
    
    if (entry.month < 1 || entry.month > 12) {
      entry.errors.push(`월은 1-12 사이여야 합니다 (현재: ${entry.month})`);
    }
    
    if (entry.year < 2020 || entry.year > 2030) {
      entry.errors.push(`연도가 유효하지 않습니다 (현재: ${entry.year})`);
    }
    
    if (entry.amount < 0) {
      entry.errors.push("금액은 0 이상이어야 합니다");
    }
    
    // 새 필드 검증
    if (entry.businessDivision && !isValidBusinessDivision(entry.businessDivision)) {
      entry.errors.push(`유효하지 않은 사업구분: ${entry.businessDivision}`);
    }
    
    if (entry.costType && !isValidCostType(entry.costType)) {
      entry.errors.push(`유효하지 않은 비용 유형: ${entry.costType}`);
    }
    
    entry.isValid = entry.errors.length === 0;
  };

  const parseExcel = useCallback((buffer: ArrayBuffer): PreviewEntry[] => {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
    
    const entries: PreviewEntry[] = [];
    
    // Skip header row
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length < 6) continue;
      
      const entry: PreviewEntry = {
        row: i + 1,
        department: String(row[0] || "").trim(),
        accountCategory: String(row[1] || "").trim(),
        month: parseInt(String(row[2])) || 0,
        year: parseInt(String(row[3])) || 0,
        type: String(row[4] || "").trim(), // 구분: 예산 또는 실제
        amount: parseFloat(String(row[5] || 0).replace(/,/g, '')) || 0,
        // 새 필드들 (선택적, 기본값 제공)
        isWithinBudget: row[6] ? String(row[6]).trim().toLowerCase() === "예산내" || String(row[6]).trim().toLowerCase() === "true" : true,
        businessDivision: String(row[7] || "").trim() || "전체",
        projectName: String(row[8] || "").trim() || "", // 프로젝트명 (필수)
        calculationBasis: String(row[9] || "").trim() || "", // 산정근거/집행내역 (필수)
        costType: String(row[10] || "").trim() || "변동비",
        isValid: true,
        errors: [],
      };
      
      validateEntry(entry);
      entries.push(entry);
    }
    
    return entries;
  }, []);

  const isExcelFile = (file: File): boolean => {
    const excelTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    return excelTypes.includes(file.type) || 
           file.name.endsWith(".xlsx") || 
           file.name.endsWith(".xls");
  };

  const isCSVFile = (file: File): boolean => {
    return file.type === "text/csv" || file.name.endsWith(".csv");
  };

  const processFile = useCallback(async (selectedFile: File) => {
    setIsLoading(true);
    setFile(selectedFile);
    
    try {
      let entries: PreviewEntry[];
      
      if (isExcelFile(selectedFile)) {
        const buffer = await selectedFile.arrayBuffer();
        entries = parseExcel(buffer);
      } else if (isCSVFile(selectedFile)) {
        const text = await selectedFile.text();
        entries = parseCSV(text);
      } else {
        throw new Error("Unsupported file type");
      }
      
      const validEntries = entries.filter(e => e.isValid);
      const invalidEntries = entries.filter(e => !e.isValid);
      
      setPreview({
        isValid: invalidEntries.length === 0,
        totalRows: entries.length,
        validRows: validEntries.length,
        invalidRows: invalidEntries.length,
        entries,
        errors: invalidEntries.flatMap(e => 
          e.errors.map(err => ({ row: e.row, message: err }))
        ),
      });
    } catch {
      toast({
        title: "파일 처리 오류",
        description: "파일을 읽는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [parseCSV, parseExcel, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isCSVFile(droppedFile) || isExcelFile(droppedFile)) {
        processFile(droppedFile);
      } else {
        toast({
          title: "지원하지 않는 파일 형식",
          description: "CSV 또는 Excel 파일(.xlsx, .xls)만 업로드할 수 있습니다.",
          variant: "destructive",
        });
      }
    }
  }, [processFile, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.validRows === 0) return;
    
    setIsImporting(true);
    try {
      const validEntries = preview.entries.filter(e => e.isValid);
      
      // 같은 키로 그룹화하여 예산과 실제를 합침 (공통 유틸리티 사용)
      const groupedMap = groupEntriesByKey(
        validEntries,
        (entry) => ({
          isBudget: isBudgetType(entry.type),
          amount: entry.amount,
        }),
        (entry) => ({
          calculationBasis: entry.calculationBasis,
          isWithinBudget: entry.isWithinBudget ?? true,
          businessDivision: entry.businessDivision || "전체",
          costType: entry.costType || "변동비",
        })
      );
      
      // 그룹화된 데이터를 배열로 변환
      const mergedEntries = Array.from(groupedMap.values());
      
      await onImport(mergedEntries);
      toast({
        title: "가져오기 완료",
        description: `${mergedEntries.length}개의 항목이 성공적으로 추가되었습니다.`,
      });
      handleReset();
      setOpen(false);
    } catch {
      toast({
        title: "가져오기 실패",
        description: "데이터를 가져오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 min-h-[44px]" data-testid="button-import-csv">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">가져오기</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Eye className="h-5 w-5 text-primary" />
            데이터 가져오기 미리보기
          </DialogTitle>
          <DialogDescription>
            CSV 또는 Excel 파일을 업로드하여 데이터를 미리 확인하고 가져올 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!preview ? (
            <div
              className={`
                border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
                ${dragActive 
                  ? "border-primary bg-primary/5 scale-[1.01]" 
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <p className="text-lg text-muted-foreground">파일 처리 중...</p>
                </div>
              ) : (
                <label htmlFor="csv-upload" className="cursor-pointer block">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <FileUp className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">파일을 드래그하거나 클릭하여 업로드</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        부서, 계정과목, 월, 연도, 예산, 실제 금액이 포함된 CSV 또는 Excel 파일 (.xlsx, .xls)
                      </p>
                    </div>
                    <Button variant="outline" className="gap-2 min-h-[44px]">
                      <FileSpreadsheet className="h-4 w-4" />
                      파일 선택
                    </Button>
                  </div>
                </label>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info & Summary */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <span className="font-medium">{file?.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={handleReset}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 ml-auto">
                  <Badge variant="outline" className="gap-1">
                    총 {preview.totalRows}개 행
                  </Badge>
                  <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/30">
                    <CheckCircle2 className="h-3 w-3" />
                    {preview.validRows}개 유효
                  </Badge>
                  {preview.invalidRows > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      {preview.invalidRows}개 오류
                    </Badge>
                  )}
                </div>
              </div>

              {/* Validation Alerts */}
              {preview.invalidRows > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>유효성 검사 오류</AlertTitle>
                  <AlertDescription>
                    {preview.invalidRows}개의 행에서 오류가 발견되었습니다. 
                    오류가 있는 데이터는 가져오기에서 제외됩니다.
                  </AlertDescription>
                </Alert>
              )}

              {preview.isValid && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700">유효성 검사 통과</AlertTitle>
                  <AlertDescription className="text-green-600">
                    모든 데이터가 유효합니다. 가져오기를 진행할 수 있습니다.
                  </AlertDescription>
                </Alert>
              )}

              {/* Data Preview Tabs */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="gap-2">
                    전체 ({preview.totalRows})
                  </TabsTrigger>
                  <TabsTrigger value="valid" className="gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    유효 ({preview.validRows})
                  </TabsTrigger>
                  <TabsTrigger value="errors" className="gap-2">
                    <XCircle className="h-3 w-3" />
                    오류 ({preview.invalidRows})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <PreviewTable 
                    entries={preview.entries} 
                    formatCurrency={formatCurrency}
                  />
                </TabsContent>

                <TabsContent value="valid" className="mt-4">
                  <PreviewTable 
                    entries={preview.entries.filter(e => e.isValid)} 
                    formatCurrency={formatCurrency}
                  />
                </TabsContent>

                <TabsContent value="errors" className="mt-4">
                  {preview.invalidRows === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      오류가 없습니다.
                    </div>
                  ) : (
                    <PreviewTable 
                      entries={preview.entries.filter(e => !e.isValid)} 
                      formatCurrency={formatCurrency}
                      showErrors
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {preview && (
            <>
              <Button variant="outline" onClick={handleReset} className="gap-2 min-h-[44px]">
                <X className="h-4 w-4" />
                다시 선택
              </Button>
              <Button 
                onClick={handleImport}
                disabled={preview.validRows === 0 || isImporting}
                className="gap-2 min-h-[44px]"
                data-testid="button-confirm-import"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    가져오는 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {preview.validRows}개 항목 가져오기
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PreviewTableProps {
  entries: PreviewEntry[];
  formatCurrency: (value: number) => string;
  showErrors?: boolean;
}

function PreviewTable({ entries, formatCurrency, showErrors }: PreviewTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <TableRow>
            <TableHead className="w-[60px]">행</TableHead>
            <TableHead>부서</TableHead>
            <TableHead className="hidden md:table-cell">계정과목</TableHead>
            <TableHead className="hidden xl:table-cell">예산 내/외</TableHead>
            <TableHead className="hidden xl:table-cell">사업구분</TableHead>
            <TableHead className="hidden 2xl:table-cell">프로젝트명</TableHead>
            <TableHead className="hidden lg:table-cell">산정근거/집행내역</TableHead>
            <TableHead className="w-[60px]">월</TableHead>
            <TableHead className="w-[70px]">연도</TableHead>
            <TableHead className="w-[80px]">구분</TableHead>
            <TableHead className="text-right">금액</TableHead>
            <TableHead className="w-[60px]">상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow 
              key={entry.row}
              className={entry.isValid ? "" : "bg-red-500/5"}
            >
              <TableCell className="font-mono text-sm text-muted-foreground">
                {entry.row}
              </TableCell>
              <TableCell className="font-medium max-w-[150px] truncate">
                {entry.department || <span className="text-muted-foreground italic">비어있음</span>}
              </TableCell>
              <TableCell className="hidden md:table-cell max-w-[150px] truncate">
                {entry.accountCategory || <span className="text-muted-foreground italic">비어있음</span>}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <Badge variant={entry.isWithinBudget !== false ? "default" : "destructive"} className="text-xs">
                  {entry.isWithinBudget !== false ? "예산 내" : "예산 외"}
                </Badge>
              </TableCell>
              <TableCell className="hidden xl:table-cell text-sm">
                {entry.businessDivision || "전체"}
              </TableCell>
              <TableCell className="hidden 2xl:table-cell max-w-[150px] truncate text-sm" title={entry.projectName}>
                {entry.projectName || "-"}
              </TableCell>
              <TableCell className="hidden lg:table-cell max-w-[150px] truncate text-sm" title={entry.calculationBasis}>
                {entry.calculationBasis || <span className="text-muted-foreground italic">비어있음</span>}
              </TableCell>
              <TableCell>{entry.month || "-"}</TableCell>
              <TableCell>{entry.year || "-"}</TableCell>
              <TableCell className="text-sm">
                <Badge variant={entry.type === "예산" || entry.type.toLowerCase() === "budget" ? "default" : "secondary"}>
                  {entry.type || "-"}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatCurrency(entry.amount)}
              </TableCell>
              <TableCell>
                {entry.isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="relative group">
                    <XCircle className="h-4 w-4 text-red-500 cursor-help" />
                    {showErrors && entry.errors.length > 0 && (
                      <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-popover border rounded-lg shadow-lg text-xs z-50 invisible group-hover:visible">
                        <ul className="list-disc list-inside space-y-1">
                          {entry.errors.map((err, idx) => (
                            <li key={idx} className="text-red-600">{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

