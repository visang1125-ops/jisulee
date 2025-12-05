import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, type BudgetFilter } from "./storage";
import { z } from "zod";
import type { Department, AccountCategory, BusinessDivision, CostType } from "@shared/schema";
import { DEPARTMENTS, ACCOUNT_CATEGORIES, BUSINESS_DIVISIONS, COST_TYPES, SETTLEMENT_MONTH } from "@shared/constants";
import { getAuthenticatedUser, listRepositories, createRepository, getRepository } from "./github";
import { handleError, NotFoundError, ValidationError, InternalServerError } from "./errors";
import { log } from "./app";

const budgetFilterSchema = z.object({
  startMonth: z.coerce.number().min(1).max(12).optional(),
  endMonth: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().optional(),
  departments: z.array(z.string()).optional(),
  accountCategories: z.array(z.string()).optional(),
});

const budgetEntrySchema = z.object({
  department: z.enum(DEPARTMENTS as [string, ...string[]]),
  accountCategory: z.enum(ACCOUNT_CATEGORIES as [string, ...string[]]),
  month: z.number().min(1).max(12),
  year: z.number(),
  budgetAmount: z.number().min(0),
  actualAmount: z.number().min(0),
  // 새로운 필드들
  isWithinBudget: z.boolean().default(true),
  businessDivision: z.enum(BUSINESS_DIVISIONS as [string, ...string[]]),
  projectName: z.string().min(1, "프로젝트명은 필수입니다"),
  calculationBasis: z.string().min(1, "산정근거/집행내역은 필수입니다"),
  costType: z.enum(COST_TYPES as [string, ...string[]]),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all budget entries with optional filtering
  app.get("/api/budget", async (req: Request, res: Response) => {
    try {
      const query = req.query;
      
      // Parse departments and accountCategories from query string
      let departments: string[] | undefined;
      let accountCategories: string[] | undefined;
      
      if (query.departments) {
        departments = Array.isArray(query.departments) 
          ? query.departments as string[]
          : [query.departments as string];
      }
      
      if (query.accountCategories) {
        accountCategories = Array.isArray(query.accountCategories)
          ? query.accountCategories as string[]
          : [query.accountCategories as string];
      }

      const filters: BudgetFilter = {
        startMonth: query.startMonth ? parseInt(query.startMonth as string) : undefined,
        endMonth: query.endMonth ? parseInt(query.endMonth as string) : undefined,
        year: query.year ? parseInt(query.year as string) : undefined,
        departments: departments as Department[] | undefined,
        accountCategories: accountCategories as AccountCategory[] | undefined,
      };

      const entries = await storage.getBudgetEntries(filters);
      log(`Fetched ${entries.length} budget entries`);
      res.json(entries);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get single budget entry
  app.get("/api/budget/:id", async (req: Request, res: Response) => {
    try {
      const entry = await storage.getBudgetEntry(req.params.id);
      if (!entry) {
        throw new NotFoundError("Budget entry", req.params.id);
      }
      res.json(entry);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Create budget entry
  app.post("/api/budget", async (req: Request, res: Response) => {
    try {
      const result = budgetEntrySchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError("Invalid budget entry data", result.error.issues);
      }

      const data = result.data;
      // Storage layer handles executionRate calculation and settlement-month constraint
      const entry = await storage.createBudgetEntry({
        ...data,
        department: data.department as Department,
        accountCategory: data.accountCategory as AccountCategory,
        businessDivision: data.businessDivision as BusinessDivision,
        costType: data.costType as CostType,
        executionRate: 0, // Will be recalculated by storage
      });
      log(`Created budget entry: ${entry.id}`);
      res.status(201).json(entry);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Update budget entry
  app.patch("/api/budget/:id", async (req: Request, res: Response) => {
    try {
      const partialSchema = budgetEntrySchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError("Invalid budget entry data", result.error.issues);
      }

      const data = result.data;
      const updateData: Partial<{
        department: Department;
        accountCategory: AccountCategory;
        month: number;
        year: number;
        budgetAmount: number;
        actualAmount: number;
      }> = {};

      if (data.department) updateData.department = data.department as Department;
      if (data.accountCategory) updateData.accountCategory = data.accountCategory as AccountCategory;
      if (data.month !== undefined) updateData.month = data.month;
      if (data.year !== undefined) updateData.year = data.year;
      if (data.budgetAmount !== undefined) updateData.budgetAmount = data.budgetAmount;
      if (data.actualAmount !== undefined) updateData.actualAmount = data.actualAmount;

      const entry = await storage.updateBudgetEntry(req.params.id, updateData);
      if (!entry) {
        throw new NotFoundError("Budget entry", req.params.id);
      }
      log(`Updated budget entry: ${req.params.id}`);
      res.json(entry);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Delete budget entry
  app.delete("/api/budget/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteBudgetEntry(req.params.id);
      if (!success) {
        throw new NotFoundError("Budget entry", req.params.id);
      }
      log(`Deleted budget entry: ${req.params.id}`);
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });

  // Bulk import budget entries
  app.post("/api/budget/import", async (req: Request, res: Response) => {
    try {
      const entriesSchema = z.array(z.object({
        department: z.enum(DEPARTMENTS as [string, ...string[]]),
        accountCategory: z.enum(ACCOUNT_CATEGORIES as [string, ...string[]]),
        description: z.string().min(1, "적요는 필수입니다"),
        month: z.number().min(1).max(12),
        year: z.number(),
        budgetAmount: z.number().min(0),
        actualAmount: z.number().min(0),
        // 새로운 필드들 (선택적)
        isWithinBudget: z.boolean().default(true).optional(),
        businessDivision: z.enum(BUSINESS_DIVISIONS as [string, ...string[]]).default("전체").optional(),
        projectName: z.string().default("").optional(),
        calculationBasis: z.string().default("").optional(),
        costType: z.enum(COST_TYPES as [string, ...string[]]).default("변동비").optional(),
      }));

      const result = entriesSchema.safeParse(req.body.entries);
      if (!result.success) {
        throw new ValidationError("Invalid budget entries data", result.error.issues);
      }

      const entriesToCreate = result.data.map(entry => ({
        ...entry,
        department: entry.department as Department,
        accountCategory: entry.accountCategory as AccountCategory,
        businessDivision: (entry.businessDivision || "전체") as BusinessDivision,
        costType: (entry.costType || "변동비") as CostType,
        isWithinBudget: entry.isWithinBudget ?? true,
        projectName: entry.projectName || entry.description,
        calculationBasis: entry.calculationBasis || entry.description,
        executionRate: 0,
      }));

      const createdEntries = await storage.createBudgetEntries(entriesToCreate);
      log(`Imported ${createdEntries.length} budget entries`);
      res.status(201).json({ 
        success: true, 
        count: createdEntries.length,
        entries: createdEntries 
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get summary statistics
  app.get("/api/budget/summary/stats", async (req: Request, res: Response) => {
    try {
      const entries = await storage.getAllBudgetEntries();
      const settlementMonth = SETTLEMENT_MONTH;
      
      const settledEntries = entries.filter(e => e.month <= settlementMonth);
      
      const totalBudget = entries.reduce((sum, e) => sum + e.budgetAmount, 0);
      const settledBudget = settledEntries.reduce((sum, e) => sum + e.budgetAmount, 0);
      const totalActual = entries.reduce((sum, e) => sum + e.actualAmount, 0);
      const executionRate = settledBudget > 0 ? (totalActual / settledBudget) * 100 : 0;
      const projectedAnnual = settlementMonth > 0 ? (totalActual / settlementMonth) * 12 : 0;
      const remainingBudget = totalBudget - totalActual;

      res.json({
        totalBudget,
        totalActual,
        executionRate,
        projectedAnnual,
        remainingBudget,
        settlementMonth,
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Export all data as JSON
  app.get("/api/budget/export/json", async (req: Request, res: Response) => {
    try {
      const entries = await storage.getAllBudgetEntries();
      log(`Exported ${entries.length} entries as JSON`);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=budget_data_${new Date().toISOString().split('T')[0]}.json`);
      res.json({
        exportDate: new Date().toISOString(),
        settlementMonth: SETTLEMENT_MONTH,
        departments: DEPARTMENTS,
        accountCategories: ACCOUNT_CATEGORIES,
        data: entries,
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Clear all budget entries
  app.delete("/api/budget/clear", async (req: Request, res: Response) => {
    try {
      await storage.clearAllBudgetEntries();
      log("All budget entries cleared");
      res.json({ success: true, message: "모든 예산 데이터가 삭제되었습니다." });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Reload data from Excel file
  app.post("/api/budget/reload-from-excel", async (req: Request, res: Response) => {
    try {
      const filePath = req.body.filePath; // 선택적: 특정 파일 경로
      const count = await storage.reloadFromExcel(filePath);
      log(`Reloaded ${count} entries from Excel`);
      res.json({ 
        success: true, 
        count,
        message: `엑셀 파일에서 ${count}개의 항목을 로드했습니다.` 
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Export as CSV
  app.get("/api/budget/export/csv", async (req: Request, res: Response) => {
    try {
      const entries = await storage.getAllBudgetEntries();
      
      const headers = ["ID", "부서", "계정과목", "적요", "월", "연도", "예산", "실제", "집행률"];
      const csvRows = [
        headers.join(","),
        ...entries.map(e => [
          e.id,
          `"${e.department}"`,
          `"${e.accountCategory}"`,
          `"${e.description}"`,
          e.month,
          e.year,
          e.budgetAmount,
          e.actualAmount,
          e.executionRate.toFixed(2),
        ].join(",")),
      ];
      
      const csvContent = "\uFEFF" + csvRows.join("\n");
      
      log(`Exported ${entries.length} entries as CSV`);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=budget_data_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get template CSV for data import
  app.get("/api/budget/template/csv", async (req: Request, res: Response) => {
    try {
      const headers = ["부서", "계정과목", "적요", "월", "연도", "예산", "실제"];
      const exampleRows = [
        [`"${DEPARTMENTS[0]}"`, `"${ACCOUNT_CATEGORIES[0]}"`, `"온라인 광고비"`, "1", "2025", "10000000", "8000000"],
        [`"${DEPARTMENTS[1]}"`, `"${ACCOUNT_CATEGORIES[1]}"`, `"인터넷 회선비"`, "2", "2025", "15000000", "12000000"],
      ];
      
      const csvContent = "\uFEFF" + [headers.join(","), ...exampleRows.map(r => r.join(","))].join("\n");
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=budget_template.csv');
      res.send(csvContent);
    } catch (error) {
      handleError(error, res);
    }
  });

  // GitHub API routes
  app.get("/api/github/user", async (req, res) => {
    try {
      const user = await getAuthenticatedUser();
      res.json({ login: user.login, name: user.name, avatar_url: user.avatar_url });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      handleError(error, res);
    }
  });

  app.get("/api/github/repos", async (req, res) => {
    try {
      const repos = await listRepositories();
      res.json(repos.map(r => ({ name: r.name, full_name: r.full_name, html_url: r.html_url, private: r.private })));
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/github/repos", async (req, res) => {
    try {
      const { name, description, isPrivate } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Repository name is required" });
      }
      const repo = await createRepository(name, description || "", isPrivate || false);
      res.status(201).json({ name: repo.name, full_name: repo.full_name, html_url: repo.html_url, clone_url: repo.clone_url });
    } catch (error) {
      handleError(error, res);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
