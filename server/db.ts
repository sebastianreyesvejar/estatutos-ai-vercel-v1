import { and, desc, eq, like, or, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  companies,
  documents,
  socialObjects,
  syncJobs,
  draftStatutes,
  type Company,
  type InsertCompany,
  type Document,
  type InsertDocument,
  type InsertSocialObject,
  type InsertSyncJob,
  type InsertDraftStatute,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ─────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Companies ─────────────────────────────────────────────────────────────────
export async function upsertCompany(data: InsertCompany): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(companies).where(eq(companies.name, data.name)).limit(1);
  if (existing.length > 0) {
    await db.update(companies).set({ rubro: data.rubro, driveFolderId: data.driveFolderId, updatedAt: new Date() }).where(eq(companies.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(companies).values(data);
  return (result[0] as any).insertId as number;
}

export async function getCompanies(opts?: { search?: string; rubro?: string; status?: Company["status"]; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  if (opts?.search) conditions.push(like(companies.name, `%${opts.search}%`));
  if (opts?.rubro) conditions.push(eq(companies.rubro, opts.rubro));
  if (opts?.status) conditions.push(eq(companies.status, opts.status));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  const [items, totalRows] = await Promise.all([
    db.select().from(companies).where(where).orderBy(desc(companies.updatedAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(companies).where(where),
  ]);
  return { items, total: totalRows[0]?.count ?? 0 };
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateCompanyStatus(id: number, status: Company["status"]) {
  const db = await getDb();
  if (!db) return;
  await db.update(companies).set({ status, updatedAt: new Date() }).where(eq(companies.id, id));
}

// ─── Documents ─────────────────────────────────────────────────────────────────
export async function upsertDocument(data: InsertDocument): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(documents).where(eq(documents.driveFileId, data.driveFileId)).limit(1);
  if (existing.length > 0) return existing[0].id;
  const result = await db.insert(documents).values(data);
  return (result[0] as any).insertId as number;
}

export async function getDocumentsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.companyId, companyId)).orderBy(desc(documents.createdAt));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateDocumentStatus(id: number, status: Document["status"], extra?: { errorMessage?: string; processedAt?: Date; s3Key?: string; s3Url?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(documents).set({ status, updatedAt: new Date(), ...extra }).where(eq(documents.id, id));
}

export async function getPendingDocuments(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.status, "pending")).orderBy(documents.createdAt).limit(limit);
}

export async function getDocumentStats() {
  const db = await getDb();
  if (!db) return { pending: 0, downloading: 0, processing: 0, processed: 0, error: 0, total: 0 };
  const rows = await db.select({ status: documents.status, count: count() }).from(documents).groupBy(documents.status);
  const stats: Record<string, number> = { pending: 0, downloading: 0, processing: 0, processed: 0, error: 0, total: 0 };
  for (const row of rows) {
    stats[row.status] = row.count;
    stats.total += row.count;
  }
  return stats;
}

// ─── Social Objects ────────────────────────────────────────────────────────────
export async function insertSocialObject(data: InsertSocialObject): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(socialObjects).values(data);
  return (result[0] as any).insertId as number;
}

export async function getSocialObjectByDocument(documentId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(socialObjects).where(eq(socialObjects.documentId, documentId)).limit(1);
  return result[0] ?? null;
}

export async function getSocialObjectsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialObjects).where(eq(socialObjects.companyId, companyId));
}

export async function searchSocialObjects(opts: { query?: string; rubro?: string; isValidated?: boolean; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  if (opts.query) {
    conditions.push(or(
      like(socialObjects.rawText, `%${opts.query}%`),
      like(socialObjects.structuredText, `%${opts.query}%`),
      like(socialObjects.rubro, `%${opts.query}%`)
    ));
  }
  if (opts.rubro) conditions.push(eq(socialObjects.rubro, opts.rubro));
  if (opts.isValidated !== undefined) conditions.push(eq(socialObjects.isValidated, opts.isValidated));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;
  const [items, totalRows] = await Promise.all([
    db.select({
      id: socialObjects.id,
      companyId: socialObjects.companyId,
      documentId: socialObjects.documentId,
      rawText: socialObjects.rawText,
      structuredText: socialObjects.structuredText,
      rubro: socialObjects.rubro,
      keywords: socialObjects.keywords,
      activities: socialObjects.activities,
      isValidated: socialObjects.isValidated,
      extractionConfidence: socialObjects.extractionConfidence,
      createdAt: socialObjects.createdAt,
      companyName: companies.name,
    }).from(socialObjects).leftJoin(companies, eq(socialObjects.companyId, companies.id)).where(where).orderBy(desc(socialObjects.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(socialObjects).where(where),
  ]);
  return { items, total: totalRows[0]?.count ?? 0 };
}

export async function updateSocialObjectValidation(id: number, data: { manualOverride?: string; isValidated: boolean; validatedBy: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(socialObjects).set({ isValidated: data.isValidated, validatedBy: data.validatedBy, validatedAt: new Date(), manualOverride: data.manualOverride, updatedAt: new Date() }).where(eq(socialObjects.id, id));
}

export async function getDistinctRubros(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.selectDistinct({ rubro: socialObjects.rubro }).from(socialObjects).where(sql`${socialObjects.rubro} IS NOT NULL`);
  return rows.map((r) => r.rubro!).filter(Boolean).sort();
}

export async function getKnowledgeBaseStats() {
  const db = await getDb();
  if (!db) return { totalCompanies: 0, totalDocuments: 0, totalSocialObjects: 0, validated: 0, rubros: 0, docStats: { pending: 0, downloading: 0, processing: 0, processed: 0, error: 0, total: 0 } };
  const [companyCount, docStats, soCount, validatedCount, rubroCount] = await Promise.all([
    db.select({ count: count() }).from(companies),
    getDocumentStats(),
    db.select({ count: count() }).from(socialObjects),
    db.select({ count: count() }).from(socialObjects).where(eq(socialObjects.isValidated, true)),
    db.selectDistinct({ rubro: socialObjects.rubro }).from(socialObjects).where(sql`${socialObjects.rubro} IS NOT NULL`),
  ]);
  return { totalCompanies: companyCount[0]?.count ?? 0, totalDocuments: docStats.total, totalSocialObjects: soCount[0]?.count ?? 0, validated: validatedCount[0]?.count ?? 0, rubros: rubroCount.length, docStats };
}

// ─── Sync Jobs ─────────────────────────────────────────────────────────────────
export async function createSyncJob(triggeredBy?: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(syncJobs).values({ triggeredBy, status: "running" });
  return (result[0] as any).insertId as number;
}

export async function updateSyncJob(id: number, data: Partial<{ status: "running" | "completed" | "failed"; totalFiles: number; newFiles: number; processedFiles: number; errorFiles: number; completedAt: Date; errorMessage: string }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(syncJobs).set(data).where(eq(syncJobs.id, id));
}

export async function getLatestSyncJob() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(syncJobs).orderBy(desc(syncJobs.startedAt)).limit(1);
  return result[0] ?? null;
}

export async function getSyncJobs(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(syncJobs).orderBy(desc(syncJobs.startedAt)).limit(limit);
}

// ─── Draft Statutes ────────────────────────────────────────────────────────────
export async function insertDraftStatute(data: InsertDraftStatute): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(draftStatutes).values(data);
  return (result[0] as any).insertId as number;
}

export async function getDraftsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(draftStatutes).where(eq(draftStatutes.userId, userId)).orderBy(desc(draftStatutes.createdAt));
}

export async function getDraftById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(draftStatutes).where(eq(draftStatutes.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateDraft(id: number, data: Partial<{ title: string; generatedSocialObject: string; generatedFullStatute: string }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(draftStatutes).set({ ...data, updatedAt: new Date() }).where(eq(draftStatutes.id, id));
}

export async function deleteDraft(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(draftStatutes).where(eq(draftStatutes.id, id));
}
