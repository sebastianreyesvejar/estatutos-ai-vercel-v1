import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getCompanies, getCompanyById, updateCompanyStatus,
  getDocumentsByCompany, getDocumentById, updateDocumentStatus, getPendingDocuments, getDocumentStats,
  searchSocialObjects, getSocialObjectByDocument, getSocialObjectsByCompany, updateSocialObjectValidation, getDistinctRubros,
  getKnowledgeBaseStats, createSyncJob, updateSyncJob, getLatestSyncJob, getSyncJobs,
  insertDraftStatute, getDraftsByUser, getDraftById, updateDraft, deleteDraft,
  upsertCompany, upsertDocument, insertSocialObject,
} from "./db";
import { listFolderContents, downloadFileAsBuffer } from "./drive";
import { extractTextFromPdfBuffer, extractSocialObject, generateSocialObjectDraft, generateFullStatuteDraft } from "./extractor";
import { storagePut } from "./storage";

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID ?? "1Wo6UIKhPaCMxTWJNcxNEVX9bOTHzSN1i";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Knowledge Base ──────────────────────────────────────────────────────────
  knowledge: router({
    stats: publicProcedure.query(async () => {
      return getKnowledgeBaseStats();
    }),

    search: publicProcedure
      .input(z.object({
        query: z.string().optional(),
        rubro: z.string().optional(),
        isValidated: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return searchSocialObjects(input);
      }),

    rubros: publicProcedure.query(async () => {
      return getDistinctRubros();
    }),
  }),

  // ─── Companies ───────────────────────────────────────────────────────────────
  companies: router({
    list: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        rubro: z.string().optional(),
        status: z.enum(["pending", "processing", "processed", "error"]).optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return getCompanies(input);
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const company = await getCompanyById(input.id);
        if (!company) throw new TRPCError({ code: "NOT_FOUND" });
        const [docs, socialObjs] = await Promise.all([
          getDocumentsByCompany(input.id),
          getSocialObjectsByCompany(input.id),
        ]);
        return { company, documents: docs, socialObjects: socialObjs };
      }),
  }),

  // ─── Documents ───────────────────────────────────────────────────────────────
  documents: router({
    stats: publicProcedure.query(async () => {
      return getDocumentStats();
    }),

    pending: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return getPendingDocuments(input.limit);
      }),

    processOne: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId);
        if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Documento no encontrado" });

        const company = await getCompanyById(doc.companyId);
        await updateDocumentStatus(doc.id, "downloading");

        try {
          const accessToken = (ctx.req as any).driveAccessToken as string | undefined;
          const buffer = await downloadFileAsBuffer(doc.driveFileId, accessToken);

          // Upload to S3
          const s3Key = `documents/${doc.companyId}/${doc.driveFileId}.pdf`;
          const { url: s3Url } = await storagePut(s3Key, buffer, "application/pdf");
          await updateDocumentStatus(doc.id, "processing", { s3Key, s3Url });

          // Extract text and social object
          const pdfText = await extractTextFromPdfBuffer(buffer);
          const extracted = await extractSocialObject(pdfText, company?.name);

          // Save social object
          await insertSocialObject({
            companyId: doc.companyId,
            documentId: doc.id,
            rawText: extracted.rawText,
            structuredText: extracted.structuredText,
            rubro: extracted.rubro,
            keywords: extracted.keywords,
            activities: extracted.activities,
            extractionConfidence: extracted.confidence,
          });

          // Update company rubro if not set
          if (company && !company.rubro && extracted.rubro) {
            await updateCompanyStatus(company.id, "processed");
          }

          await updateDocumentStatus(doc.id, "processed", { processedAt: new Date() });
          return { success: true, extracted };
        } catch (error: any) {
          await updateDocumentStatus(doc.id, "error", { errorMessage: error.message });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        }
      }),
  }),

  // ─── Social Objects ───────────────────────────────────────────────────────────
  socialObjects: router({
    validate: protectedProcedure
      .input(z.object({
        id: z.number(),
        manualOverride: z.string().optional(),
        isValidated: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateSocialObjectValidation(input.id, {
          manualOverride: input.manualOverride,
          isValidated: input.isValidated,
          validatedBy: ctx.user!.id,
        });
        return { success: true };
      }),

    byDocument: publicProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ input }) => {
        return getSocialObjectByDocument(input.documentId);
      }),
  }),

  // ─── Drive Sync ───────────────────────────────────────────────────────────────
  sync: router({
    status: publicProcedure.query(async () => {
      const [latest, jobs] = await Promise.all([getLatestSyncJob(), getSyncJobs(5)]);
      return { latest, recent: jobs };
    }),

    start: protectedProcedure
      .input(z.object({
        accessToken: z.string().optional(),
        folderId: z.string().default(DRIVE_FOLDER_ID),
      }))
      .mutation(async ({ input, ctx }) => {
        const jobId = await createSyncJob(ctx.user!.id);

        // Run sync asynchronously
        (async () => {
          let totalFiles = 0;
          let newFiles = 0;
          let errorFiles = 0;

          try {
            // List root folder contents
            const { folders } = await listFolderContents(input.folderId, input.accessToken);
            totalFiles = folders.length;
            await updateSyncJob(jobId, { totalFiles });

            for (const folder of folders) {
              try {
                // Each folder = one company
                const companyId = await upsertCompany({
                  name: folder.name,
                  driveFolderId: folder.id,
                  status: "pending",
                });

                // List PDFs inside company folder
                const { files } = await listFolderContents(folder.id, input.accessToken);
                for (const file of files) {
                  const docId = await upsertDocument({
                    companyId,
                    driveFileId: file.id,
                    driveFileName: file.name,
                    driveWebViewLink: file.webViewLink,
                    fileSizeBytes: file.size,
                    status: "pending",
                  });
                  if (docId) newFiles++;
                }
              } catch {
                errorFiles++;
              }
            }

            await updateSyncJob(jobId, {
              status: "completed",
              totalFiles,
              newFiles,
              errorFiles,
              completedAt: new Date(),
            });
          } catch (error: any) {
            await updateSyncJob(jobId, {
              status: "failed",
              errorMessage: error.message,
              completedAt: new Date(),
            });
          }
        })();

        return { jobId, message: "Sincronización iniciada" };
      }),
  }),

  // ─── Admin ────────────────────────────────────────────────────────────────────
  admin: router({
    stats: protectedProcedure.query(async () => {
      const docStats = await getDocumentStats();
      const kbStats = await getKnowledgeBaseStats();
      return {
        totalDocuments: docStats.total,
        pending: docStats.pending,
        processing: docStats.processing,
        processed: docStats.processed,
        error: docStats.error,
        totalCompanies: kbStats.totalCompanies,
        totalSocialObjects: kbStats.totalSocialObjects,
      };
    }),

    recentJobs: protectedProcedure.query(async () => {
      const { items } = await getCompanies({ limit: 20, offset: 0 });
      // Return recent documents with status
      const docs = await getPendingDocuments(20);
      return docs;
    }),

    syncDrive: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .mutation(async ({ input, ctx }) => {
        const jobId = await createSyncJob(ctx.user!.id);
        let queued = 0;
        let errorFiles = 0;

        (async () => {
          try {
            const { folders } = await listFolderContents(DRIVE_FOLDER_ID);
            const limited = folders.slice(0, input.limit);
            await updateSyncJob(jobId, { totalFiles: limited.length });

            for (const folder of limited) {
              try {
                const companyId = await upsertCompany({
                  name: folder.name,
                  driveFolderId: folder.id,
                  status: "pending",
                });
                const { files } = await listFolderContents(folder.id);
                for (const file of files) {
                  const docId = await upsertDocument({
                    companyId,
                    driveFileId: file.id,
                    driveFileName: file.name,
                    driveWebViewLink: file.webViewLink,
                    fileSizeBytes: file.size,
                    status: "pending",
                  });
                  if (docId) queued++;
                }
              } catch { errorFiles++; }
            }
            await updateSyncJob(jobId, { status: "completed", newFiles: queued, errorFiles, completedAt: new Date() });
          } catch (error: any) {
            await updateSyncJob(jobId, { status: "failed", errorMessage: error.message, completedAt: new Date() });
          }
        })();

        return { jobId, queued, message: `Sincronización iniciada` };
      }),

    processNext: protectedProcedure.mutation(async () => {
      const [doc] = await getPendingDocuments(1);
      if (!doc) return { message: "No hay documentos pendientes" };

      await updateDocumentStatus(doc.id, "downloading");
      try {
        const buffer = await downloadFileAsBuffer(doc.driveFileId);
        const s3Key = `documents/${doc.companyId}/${doc.driveFileId}.pdf`;
        const { url: s3Url } = await storagePut(s3Key, buffer, "application/pdf");
        await updateDocumentStatus(doc.id, "processing", { s3Key, s3Url });

        const company = await getCompanyById(doc.companyId);
        const pdfText = await extractTextFromPdfBuffer(buffer);
        const extracted = await extractSocialObject(pdfText, company?.name);

        await insertSocialObject({
          companyId: doc.companyId,
          documentId: doc.id,
          rawText: extracted.rawText,
          structuredText: extracted.structuredText,
          rubro: extracted.rubro,
          keywords: extracted.keywords,
          activities: extracted.activities,
          extractionConfidence: extracted.confidence,
        });

        if (company && !company.rubro && extracted.rubro) {
          await updateCompanyStatus(company.id, "processed");
        }
        await updateDocumentStatus(doc.id, "processed", { processedAt: new Date() });
        return { message: `Procesado: ${doc.driveFileName}` };
      } catch (error: any) {
        await updateDocumentStatus(doc.id, "error", { errorMessage: error.message });
        return { message: `Error: ${error.message}` };
      }
    }),

    processAll: protectedProcedure
      .input(z.object({ batchSize: z.number().default(10) }))
      .mutation(async ({ input }) => {
        const docs = await getPendingDocuments(input.batchSize);
        if (docs.length === 0) return { message: "No hay documentos pendientes", processed: 0 };

        let processed = 0;
        let errors = 0;
        for (const doc of docs) {
          await updateDocumentStatus(doc.id, "downloading");
          try {
            const buffer = await downloadFileAsBuffer(doc.driveFileId);
            const s3Key = `documents/${doc.companyId}/${doc.driveFileId}.pdf`;
            const { url: s3Url } = await storagePut(s3Key, buffer, "application/pdf");
            await updateDocumentStatus(doc.id, "processing", { s3Key, s3Url });

            const company = await getCompanyById(doc.companyId);
            const pdfText = await extractTextFromPdfBuffer(buffer);
            const extracted = await extractSocialObject(pdfText, company?.name);

            await insertSocialObject({
              companyId: doc.companyId,
              documentId: doc.id,
              rawText: extracted.rawText,
              structuredText: extracted.structuredText,
              rubro: extracted.rubro,
              keywords: extracted.keywords,
              activities: extracted.activities,
              extractionConfidence: extracted.confidence,
            });

            if (company && !company.rubro && extracted.rubro) {
              await updateCompanyStatus(company.id, "processed");
            }
            await updateDocumentStatus(doc.id, "processed", { processedAt: new Date() });
            processed++;
          } catch (error: any) {
            await updateDocumentStatus(doc.id, "error", { errorMessage: error.message });
            errors++;
          }
        }
        return { message: `Procesados: ${processed}, Errores: ${errors}`, processed, errors };
      }),
  }),

  // ─── Drafts ───────────────────────────────────────────────────────────────────
  drafts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getDraftsByUser(ctx.user!.id);
    }),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const draft = await getDraftById(input.id);
        if (!draft) throw new TRPCError({ code: "NOT_FOUND" });
        if (draft.userId !== ctx.user!.id) throw new TRPCError({ code: "FORBIDDEN" });
        return draft;
      }),

    generateSocialObject: protectedProcedure
      .input(z.object({
        companyName: z.string().min(1),
        rubro: z.string().min(1),
        description: z.string().min(10),
        useExistingContext: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        let similarObjects: string[] = [];
        if (input.useExistingContext) {
          const { items } = await searchSocialObjects({ rubro: input.rubro, limit: 5 });
          similarObjects = items.map(i => i.structuredText ?? i.rawText).filter(Boolean);
        }

        const generated = await generateSocialObjectDraft({
          companyName: input.companyName,
          rubro: input.rubro,
          description: input.description,
          similarObjects,
        });

        const draftId = await insertDraftStatute({
          userId: ctx.user!.id,
          companyName: input.companyName,
          rubro: input.rubro,
          description: input.description,
          generatedSocialObject: generated,
          title: `Objeto Social — ${input.companyName}`,
          prompt: input.description,
        });

        return { draftId, generatedSocialObject: generated };
      }),

    generateFullStatute: protectedProcedure
      .input(z.object({
        draftId: z.number(),
        additionalInfo: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const draft = await getDraftById(input.draftId);
        if (!draft) throw new TRPCError({ code: "NOT_FOUND" });
        if (draft.userId !== ctx.user!.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (!draft.generatedSocialObject) throw new TRPCError({ code: "BAD_REQUEST", message: "Genera primero el objeto social" });

        const fullStatute = await generateFullStatuteDraft({
          companyName: draft.companyName ?? "La Sociedad",
          rubro: draft.rubro ?? "Servicios",
          socialObject: draft.generatedSocialObject,
          additionalInfo: input.additionalInfo,
        });

        await updateDraft(draft.id, { generatedFullStatute: fullStatute });
        return { fullStatute };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        generatedSocialObject: z.string().optional(),
        generatedFullStatute: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const draft = await getDraftById(input.id);
        if (!draft) throw new TRPCError({ code: "NOT_FOUND" });
        if (draft.userId !== ctx.user!.id) throw new TRPCError({ code: "FORBIDDEN" });
        await updateDraft(input.id, input);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const draft = await getDraftById(input.id);
        if (!draft) throw new TRPCError({ code: "NOT_FOUND" });
        if (draft.userId !== ctx.user!.id) throw new TRPCError({ code: "FORBIDDEN" });
        await deleteDraft(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
