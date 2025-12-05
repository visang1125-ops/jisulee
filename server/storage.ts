import { type User, type InsertUser, type BudgetEntry, type Department, type AccountCategory, type BusinessDivision, type CostType } from "@shared/schema";
import { DEPARTMENTS, ACCOUNT_CATEGORIES, SETTLEMENT_MONTH, BUSINESS_DIVISIONS, COST_TYPES } from "@shared/constants";
import { getRandomDescription } from "./descriptions";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { loadBudgetDataFromExcel } from "./excel-parser";
import { saveBudgetEntriesToExcel } from "./excel-writer";
import XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Budget operations
  getAllBudgetEntries(): Promise<BudgetEntry[]>;
  getBudgetEntries(filters: BudgetFilter): Promise<BudgetEntry[]>;
  getBudgetEntry(id: string): Promise<BudgetEntry | undefined>;
  createBudgetEntry(entry: Omit<BudgetEntry, 'id'>): Promise<BudgetEntry>;
  createBudgetEntries(entries: Omit<BudgetEntry, 'id'>[]): Promise<BudgetEntry[]>;
  updateBudgetEntry(id: string, entry: Partial<BudgetEntry>): Promise<BudgetEntry | undefined>;
  deleteBudgetEntry(id: string): Promise<boolean>;
  clearAllBudgetEntries(): Promise<void>;
  reloadFromExcel(filePath?: string): Promise<number>;
}

export interface BudgetFilter {
  startMonth?: number;
  endMonth?: number;
  year?: number;
  departments?: Department[];
  accountCategories?: AccountCategory[];
}

import { calculateExecutionRate, enforceSettlementConstraint } from "./budget-utils";

function generateMockBudgetData(): BudgetEntry[] {
  const data: BudgetEntry[] = [];
  let id = 1;
  const businessDivisions: Array<"키즈" | "초등" | "중등" | "전체"> = ["키즈", "초등", "중등", "전체"];
  const costTypes: Array<"고정비" | "변동비"> = ["고정비", "변동비"];
  const projectNames = ["이벤트프로모션", "마케팅 캠페인", "시스템 개선", "콘텐츠 제작", "인프라 구축"];

  DEPARTMENTS.forEach(dept => {
    ACCOUNT_CATEGORIES.forEach(category => {
      // 각 계정과목당 월별로 1-3개의 적요 항목 생성
      for (let month = 1; month <= 12; month++) {
        const entryCount = Math.floor(Math.random() * 3) + 1; // 1-3개
        
        for (let entryIndex = 0; entryIndex < entryCount; entryIndex++) {
          const budgetAmount = Math.floor(Math.random() * 30000000) + 10000000;
          const actualAmount = month <= SETTLEMENT_MONTH 
            ? Math.floor(budgetAmount * (0.5 + Math.random() * 0.4))
            : 0;
          const description = getRandomDescription(category);
          const isWithinBudget = Math.random() > 0.1; // 90%는 예산 내
          const businessDivision = businessDivisions[Math.floor(Math.random() * businessDivisions.length)];
          const projectName = projectNames[Math.floor(Math.random() * projectNames.length)];
          const calculationBasis = `${description} - ${category} 관련 ${businessDivision} 사업 집행 내역`;
          const costType = costTypes[Math.floor(Math.random() * costTypes.length)];
          
          data.push({
            id: `entry-${id++}`,
            department: dept,
            accountCategory: category,
            description,
            month,
            year: 2025,
            budgetAmount,
            actualAmount,
            executionRate: budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0,
            isWithinBudget,
            businessDivision,
            projectName,
            calculationBasis,
            costType,
          });
        }
      }
    });
  });

  return data;
}


export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private budgetEntries: Map<string, BudgetEntry>;
  private excelPath: string;
  private fileWatcher: fs.FSWatcher | null = null;
  private isReloading: boolean = false;

  constructor() {
    this.users = new Map();
    this.budgetEntries = new Map();
    
    // 엑셀 파일 경로 설정
    this.excelPath = path.join(__dirname, '..', 'data', 'budget.xlsx');
    
    // 초기 데이터 로드
    this.loadFromExcel();
    
    // 파일 감시 시작 (실시간 로드)
    this.startFileWatcher();
  }

  /**
   * 엑셀 파일에서 데이터 로드
   */
  private loadFromExcel(): void {
    const excelData = loadBudgetDataFromExcel(this.excelPath);
    
    if (excelData.length > 0) {
      // 엑셀 파일에서 데이터를 로드한 경우
      this.budgetEntries.clear();
      excelData.forEach(entry => {
        this.budgetEntries.set(entry.id, entry);
      });
      console.log(`✅ 엑셀 파일에서 ${excelData.length}개의 예산 항목을 로드했습니다.`);
    } else {
      // 엑셀 파일이 없는 경우
      console.log('⚠️  엑셀 파일을 찾을 수 없습니다.');
      console.log('   data/budget.xlsx 파일을 생성하거나, 웹 인터페이스에서 엑셀 파일을 업로드하세요.');
      console.log('   또는 API를 통해 데이터를 추가할 수 있습니다.');
    }
  }

  /**
   * 엑셀 파일 감시 시작 (실시간 로드)
   */
  private startFileWatcher(): void {
    // 파일이 존재하지 않으면 감시 시작 안 함
    if (!fs.existsSync(this.excelPath)) {
      console.log(`⚠️  엑셀 파일이 없어 감시를 시작할 수 없습니다: ${this.excelPath}`);
      return;
    }
    
    const dir = path.dirname(this.excelPath);
    const filename = path.basename(this.excelPath);
    const fullPath = path.resolve(this.excelPath);
    
    // Windows에서 더 안정적인 파일 감시를 위해 파일 직접 감시 시도
    try {
      // 파일 직접 감시 (Windows에서 더 안정적)
      this.fileWatcher = fs.watch(fullPath, { persistent: true }, (eventType) => {
        if (eventType === 'change') {
          // 중복 로드 방지
          if (this.isReloading) {
            return;
          }
          
          this.isReloading = true;
          
          // 파일 변경 후 약간의 지연 (파일 쓰기 완료 대기)
          setTimeout(() => {
            try {
              // 파일이 실제로 존재하는지 확인
              if (fs.existsSync(fullPath)) {
                console.log(`📁 엑셀 파일 변경 감지: ${filename}`);
                this.loadFromExcel();
              }
            } catch (error) {
              console.error(`엑셀 파일 자동 로드 오류: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
              this.isReloading = false;
            }
          }, 1000); // 1초 지연 (Excel 저장 완료 대기)
        }
      });
      
      console.log(`👀 엑셀 파일 감시 시작: ${fullPath}`);
    } catch (error) {
      // 파일 직접 감시 실패 시 디렉토리 감시로 폴백
      try {
        console.warn(`파일 직접 감시 실패, 디렉토리 감시로 전환: ${error instanceof Error ? error.message : String(error)}`);
        this.fileWatcher = fs.watch(dir, { persistent: true }, (eventType, changedFile) => {
          // Windows에서 파일명이 버퍼로 올 수 있으므로 정규화
          const changedFileName = changedFile ? changedFile.toString() : '';
          if (changedFileName === filename && eventType === 'change') {
            if (this.isReloading) {
              return;
            }
            
            this.isReloading = true;
            
            setTimeout(() => {
              try {
                if (fs.existsSync(fullPath)) {
                  console.log(`📁 엑셀 파일 변경 감지 (디렉토리 감시): ${filename}`);
                  this.loadFromExcel();
                }
              } catch (error) {
                console.error(`엑셀 파일 자동 로드 오류: ${error instanceof Error ? error.message : String(error)}`);
              } finally {
                this.isReloading = false;
              }
            }, 1000);
          }
        });
        
        console.log(`👀 엑셀 파일 감시 시작 (디렉토리): ${dir}`);
      } catch (fallbackError) {
        console.error(`파일 감시 시작 실패: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
      }
    }
  }

  /**
   * 엑셀 파일에 모든 데이터 저장
   * 파일 감시가 다시 트리거되지 않도록 플래그 설정
   */
  private async saveToExcel(): Promise<void> {
    try {
      // 저장 중에는 파일 감시 이벤트 무시
      this.isReloading = true;
      
      const allEntries = Array.from(this.budgetEntries.values());
      saveBudgetEntriesToExcel(allEntries, this.excelPath);
      
      // 저장 완료 후 약간의 지연 후 플래그 해제
      setTimeout(() => {
        this.isReloading = false;
      }, 2000); // 2초 후 플래그 해제
    } catch (error) {
      console.error(`엑셀 파일 저장 오류: ${error instanceof Error ? error.message : String(error)}`);
      this.isReloading = false; // 에러 발생 시 플래그 해제
      // 저장 실패해도 메모리 작업은 계속 진행
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllBudgetEntries(): Promise<BudgetEntry[]> {
    return Array.from(this.budgetEntries.values());
  }

  async getBudgetEntries(filters: BudgetFilter): Promise<BudgetEntry[]> {
    let entries = Array.from(this.budgetEntries.values());

    if (filters.startMonth !== undefined) {
      entries = entries.filter(e => e.month >= filters.startMonth!);
    }
    if (filters.endMonth !== undefined) {
      entries = entries.filter(e => e.month <= filters.endMonth!);
    }
    if (filters.year !== undefined) {
      entries = entries.filter(e => e.year === filters.year);
    }
    if (filters.departments && filters.departments.length > 0) {
      entries = entries.filter(e => filters.departments!.includes(e.department));
    }
    if (filters.accountCategories && filters.accountCategories.length > 0) {
      entries = entries.filter(e => filters.accountCategories!.includes(e.accountCategory));
    }

    return entries;
  }

  async getBudgetEntry(id: string): Promise<BudgetEntry | undefined> {
    return this.budgetEntries.get(id);
  }

  async createBudgetEntry(entry: Omit<BudgetEntry, 'id'>): Promise<BudgetEntry> {
    const id = randomUUID();
    const actualAmount = enforceSettlementConstraint(entry.month, entry.actualAmount);
    const executionRate = calculateExecutionRate(entry.budgetAmount, actualAmount);
    const newEntry: BudgetEntry = { 
      ...entry,
      // 기존 데이터 호환성을 위한 기본값
      isWithinBudget: entry.isWithinBudget ?? true,
      businessDivision: entry.businessDivision ?? "전체",
      projectName: entry.projectName ?? "", // 필수 필드
      calculationBasis: entry.calculationBasis ?? "",
      costType: entry.costType ?? "변동비",
      id,
      actualAmount,
      executionRate,
    };
    this.budgetEntries.set(id, newEntry);
    
    // 엑셀 파일에 저장
    await this.saveToExcel();
    
    return newEntry;
  }

  async createBudgetEntries(entries: Omit<BudgetEntry, 'id'>[]): Promise<BudgetEntry[]> {
    const createdEntries: BudgetEntry[] = [];
    for (const entry of entries) {
      const id = randomUUID();
      const actualAmount = enforceSettlementConstraint(entry.month, entry.actualAmount);
      const executionRate = calculateExecutionRate(entry.budgetAmount, actualAmount);
      const newEntry: BudgetEntry = {
        ...entry,
        // 기존 데이터 호환성을 위한 기본값
        isWithinBudget: entry.isWithinBudget ?? true,
        businessDivision: entry.businessDivision ?? "전체",
        projectName: entry.projectName ?? entry.description ?? "",
        calculationBasis: entry.calculationBasis ?? entry.description ?? "",
        costType: entry.costType ?? "변동비",
        id,
        actualAmount,
        executionRate,
      };
      this.budgetEntries.set(id, newEntry);
      createdEntries.push(newEntry);
    }
    
    // 엑셀 파일에 저장 (일괄 저장)
    await this.saveToExcel();
    
    return createdEntries;
  }

  async updateBudgetEntry(id: string, updates: Partial<BudgetEntry>): Promise<BudgetEntry | undefined> {
    const existing = this.budgetEntries.get(id);
    if (!existing) return undefined;
    
    const month = updates.month ?? existing.month;
    const budgetAmount = updates.budgetAmount ?? existing.budgetAmount;
    const rawActualAmount = updates.actualAmount ?? existing.actualAmount;
    const actualAmount = enforceSettlementConstraint(month, rawActualAmount);
    const executionRate = calculateExecutionRate(budgetAmount, actualAmount);
    
    const updated: BudgetEntry = { 
      ...existing, 
      ...updates, 
      id,
      actualAmount,
      executionRate,
    };
    
    this.budgetEntries.set(id, updated);
    
    // 엑셀 파일에 저장
    await this.saveToExcel();
    
    return updated;
  }

  /**
   * 모든 예산 데이터 삭제
   */
  async clearAllBudgetEntries(): Promise<void> {
    this.budgetEntries.clear();
    
    // 엑셀 파일도 비우기 (빈 파일로 저장)
    try {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet([]);
      XLSX.utils.book_append_sheet(workbook, worksheet, '예산데이터');
      XLSX.writeFile(workbook, this.excelPath);
    } catch (error) {
      console.error(`엑셀 파일 초기화 오류: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('모든 예산 데이터가 삭제되었습니다.');
  }

  /**
   * 엑셀 파일에서 데이터를 다시 로드
   */
  async reloadFromExcel(filePath?: string): Promise<number> {
    if (filePath) {
      this.excelPath = filePath;
    }
    
    // 파일 감시 재시작
    if (this.fileWatcher) {
      this.fileWatcher.close();
    }
    this.startFileWatcher();
    
    // 데이터 로드
    this.loadFromExcel();
    
    return this.budgetEntries.size;
  }

  async deleteBudgetEntry(id: string): Promise<boolean> {
    return this.budgetEntries.delete(id);
  }
}

export const storage = new MemStorage();
