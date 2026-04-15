import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock all DB and external modules
vi.mock("./db", () => ({
  getKnowledgeBaseStats: vi.fn().mockResolvedValue({ totalCompanies: 10, totalDocuments: 20, totalSocialObjects: 15, rubros: 5 }),
  searchSocialObjects: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getDistinctRubros: vi.fn().mockResolvedValue(["Tecnología", "Construcción"]),
  getCompanies: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getCompanyById: vi.fn().mockResolvedValue(null),
  getDocumentsByCompany: vi.fn().mockResolvedValue([]),
  getSocialObjectsByCompany: vi.fn().mockResolvedValue([]),
  getDocumentStats: vi.fn().mockResolvedValue({ total: 5, pending: 2, processing: 1, processed: 2, error: 0 }),
  getPendingDocuments: vi.fn().mockResolvedValue([]),
  getDocumentById: vi.fn().mockResolvedValue(null),
  updateDocumentStatus: vi.fn().mockResolvedValue(undefined),
  updateCompanyStatus: vi.fn().mockResolvedValue(undefined),
  getSocialObjectByDocument: vi.fn().mockResolvedValue(null),
  updateSocialObjectValidation: vi.fn().mockResolvedValue(undefined),
  getLatestSyncJob: vi.fn().mockResolvedValue(null),
  getSyncJobs: vi.fn().mockResolvedValue([]),
  createSyncJob: vi.fn().mockResolvedValue(1),
  updateSyncJob: vi.fn().mockResolvedValue(undefined),
  getDraftsByUser: vi.fn().mockResolvedValue([]),
  getDraftById: vi.fn().mockResolvedValue(null),
  insertDraftStatute: vi.fn().mockResolvedValue(1),
  updateDraft: vi.fn().mockResolvedValue(undefined),
  deleteDraft: vi.fn().mockResolvedValue(undefined),
  upsertCompany: vi.fn().mockResolvedValue(1),
  upsertDocument: vi.fn().mockResolvedValue(1),
  insertSocialObject: vi.fn().mockResolvedValue(1),
}));

vi.mock("./drive", () => ({
  listFolderContents: vi.fn().mockResolvedValue({ folders: [], files: [] }),
  downloadFileAsBuffer: vi.fn().mockResolvedValue(Buffer.from("test")),
}));

vi.mock("./extractor", () => ({
  extractTextFromPdfBuffer: vi.fn().mockResolvedValue("Texto extraído del PDF"),
  extractSocialObject: vi.fn().mockResolvedValue({
    rawText: "La sociedad tiene por objeto...",
    structuredText: "Objeto social estructurado",
    rubro: "Tecnología",
    keywords: ["software", "tecnología"],
    activities: ["Desarrollo de software"],
    confidence: "high",
  }),
  generateSocialObjectDraft: vi.fn().mockResolvedValue("Objeto social generado por IA"),
  generateFullStatuteDraft: vi.fn().mockResolvedValue("Estatuto completo generado por IA"),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "https://s3.example.com/test.pdf" }),
}));

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

function createAuthCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe("knowledge router", () => {
  it("stats returns knowledge base statistics", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.knowledge.stats();
    expect(result).toHaveProperty("totalCompanies");
    expect(result).toHaveProperty("totalSocialObjects");
  });

  it("search returns paginated results", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.knowledge.search({ limit: 10, offset: 0 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("rubros returns list of distinct rubros", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.knowledge.rubros();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain("Tecnología");
  });
});

describe("companies router", () => {
  it("list returns paginated companies", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.companies.list({ limit: 20, offset: 0 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("byId throws NOT_FOUND for non-existent company", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.companies.byId({ id: 999 })).rejects.toThrow();
  });
});

describe("admin router", () => {
  it("stats requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("stats returns document statistics for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.admin.stats();
    expect(result).toHaveProperty("totalDocuments");
    expect(result).toHaveProperty("pending");
    expect(result).toHaveProperty("processed");
    expect(result).toHaveProperty("error");
  });

  it("processNext returns no-pending message when queue is empty", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.admin.processNext();
    expect(result.message).toContain("No hay documentos pendientes");
  });
});

describe("drafts router", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.drafts.list()).rejects.toThrow();
  });

  it("list returns empty array for authenticated user with no drafts", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.drafts.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("generateSocialObject creates a draft and returns draftId", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.drafts.generateSocialObject({
      companyName: "Test SpA",
      rubro: "Tecnología",
      description: "Empresa de desarrollo de software y servicios tecnológicos",
      useExistingContext: false,
    });
    expect(result).toHaveProperty("draftId");
    expect(result).toHaveProperty("generatedSocialObject");
    expect(typeof result.draftId).toBe("number");
  });
});
