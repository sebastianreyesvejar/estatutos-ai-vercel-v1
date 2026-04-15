import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 512 }).notNull(),
  rubro: varchar("rubro", { length: 256 }),
  driveFolderId: varchar("driveFolderId", { length: 128 }),
  status: mysqlEnum("status", ["pending", "processing", "processed", "error"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  driveFileId: varchar("driveFileId", { length: 128 }).notNull().unique(),
  driveFileName: varchar("driveFileName", { length: 512 }),
  driveWebViewLink: text("driveWebViewLink"),
  s3Key: varchar("s3Key", { length: 512 }),
  s3Url: text("s3Url"),
  fileSizeBytes: bigint("fileSizeBytes", { mode: "number" }),
  status: mysqlEnum("status", ["pending", "downloading", "processing", "processed", "error"])
    .default("pending")
    .notNull(),
  errorMessage: text("errorMessage"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export const socialObjects = mysqlTable("social_objects", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  documentId: int("documentId").notNull(),
  rawText: text("rawText").notNull(),
  structuredText: text("structuredText"),
  rubro: varchar("rubro", { length: 256 }),
  keywords: json("keywords").$type<string[]>(),
  activities: json("activities").$type<string[]>(),
  isValidated: boolean("isValidated").default(false).notNull(),
  validatedBy: int("validatedBy"),
  validatedAt: timestamp("validatedAt"),
  manualOverride: text("manualOverride"),
  extractionConfidence: varchar("extractionConfidence", { length: 16 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SocialObject = typeof socialObjects.$inferSelect;
export type InsertSocialObject = typeof socialObjects.$inferInsert;

export const syncJobs = mysqlTable("sync_jobs", {
  id: int("id").autoincrement().primaryKey(),
  status: mysqlEnum("status", ["running", "completed", "failed"]).default("running").notNull(),
  totalFiles: int("totalFiles").default(0),
  newFiles: int("newFiles").default(0),
  processedFiles: int("processedFiles").default(0),
  errorFiles: int("errorFiles").default(0),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  errorMessage: text("errorMessage"),
  triggeredBy: int("triggeredBy"),
});

export type SyncJob = typeof syncJobs.$inferSelect;
export type InsertSyncJob = typeof syncJobs.$inferInsert;

export const draftStatutes = mysqlTable("draft_statutes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }),
  companyName: varchar("companyName", { length: 512 }),
  rubro: varchar("rubro", { length: 256 }),
  description: text("description"),
  generatedSocialObject: text("generatedSocialObject"),
  generatedFullStatute: text("generatedFullStatute"),
  sourceSocialObjectIds: json("sourceSocialObjectIds").$type<number[]>(),
  prompt: text("prompt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DraftStatute = typeof draftStatutes.$inferSelect;
export type InsertDraftStatute = typeof draftStatutes.$inferInsert;
