import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { storagePut, storageGetSignedUrl } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ Documents Router ============
  documents: router({
    // Upload and process document with OCR
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded file
        documentType: z.enum(["receipt", "bill", "bank_statement", "other"]),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Store file in S3
          const fileBuffer = Buffer.from(input.fileData, 'base64');
          const fileKey = `documents/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          const { url } = await storagePut(fileKey, fileBuffer, 'application/octet-stream');

          // Create document record
          await db.createDocument({
            userId: ctx.user.id,
            fileName: input.fileName,
            fileKey,
            fileUrl: url,
            documentType: input.documentType,
            status: 'processing',
          });

          return {
            success: true,
            fileUrl: url,
          };
        } catch (error) {
          console.error("Document upload error:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to upload document',
          });
        }
      }),

    // Process OCR on document
    processOCR: protectedProcedure
      .input(z.object({
        documentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const doc = await db.getDocumentById(input.documentId);
          if (!doc || doc.userId !== ctx.user.id) {
            throw new TRPCError({ code: 'NOT_FOUND' });
          }

          // Download file from Supabase Storage
          const signedUrl = await storageGetSignedUrl(doc.fileKey);
          const fileResp = await fetch(signedUrl);
          if (!fileResp.ok) {
            throw new Error(`Failed to download document: ${fileResp.status}`);
          }
          const fileBuffer = await fileResp.arrayBuffer();
          const base64Data = Buffer.from(fileBuffer).toString("base64");

          // Determine MIME type from file extension
          const ext = doc.fileName.split(".").pop()?.toLowerCase() ?? "";
          const mimeType =
            ext === "pdf" ? "application/pdf"
            : ext === "png" ? "image/png"
            : ext === "jpg" || ext === "jpeg" ? "image/jpeg"
            : "application/octet-stream";

          // Call Gemini Vision API
          const geminiApiKey = process.env.GEMINI_API_KEY;
          if (!geminiApiKey) {
            throw new Error("GEMINI_API_KEY is not set");
          }

          const geminiResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    {
                      text: "Extract financial transaction data from this document.\nReturn a JSON array with: date (YYYY-MM-DD), description, amount (number), type (income/expense), confidence (0-1).\nReturn ONLY valid JSON array, no markdown.",
                    },
                  ],
                }],
              }),
            },
          );

          if (!geminiResp.ok) {
            const errText = await geminiResp.text().catch(() => geminiResp.statusText);
            throw new Error(`Gemini API error (${geminiResp.status}): ${errText}`);
          }

          const geminiData = (await geminiResp.json()) as {
            candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
          };
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
          const response = { choices: [{ message: { content: rawText } }] };

          const ocrData = JSON.parse(response.choices[0].message.content);

          // Update document status
          await db.updateDocument(input.documentId, {
            status: 'completed',
            ocrData: JSON.stringify(ocrData) as any,
            processedAt: new Date(),
            confidence: ocrData.length > 0 
              ? (ocrData.reduce((sum: number, t: any) => sum + (t.confidence || 0), 0) / ocrData.length) as any
              : (0 as any),
          });

          // Create transactions from OCR data
          const transactionIds: number[] = [];
          for (const item of ocrData) {
            const source = doc.documentType === 'other' ? 'manual' : doc.documentType;
            const itemType = item.type === 'income' || item.type === 'expense' ? item.type : 'expense';
            await db.createTransaction({
              userId: ctx.user.id,
              documentId: input.documentId,
              date: new Date(item.date),
              description: item.description,
              amount: item.amount as any,
              type: itemType,
              source: source as any,
              confidence: item.confidence as any,
            });
          }

          return {
            success: true,
            transactionCount: transactionIds.length,
            transactionIds,
          };
        } catch (error) {
          console.error("OCR processing error:", error);
          await db.updateDocument(input.documentId, {
            status: 'failed',
            errorMessage: String(error),
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to process OCR',
          });
        }
      }),

    // Get user's documents
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getDocumentsByUserId(ctx.user.id);
    }),

    // Get single document
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const doc = await db.getDocumentById(input.id);
        if (!doc || doc.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return doc;
      }),
  }),

  // ============ Transactions Router ============
  transactions: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        return db.getTransactionsByUserId(ctx.user.id, input.limit, input.offset);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const transaction = await db.getTransactionById(input.id);
        if (!transaction || transaction.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return transaction;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          description: z.string().optional(),
          amount: z.number().optional(),
          type: z.enum(['income', 'expense']).optional(),
          categoryId: z.number().optional(),
          isVerified: z.boolean().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        const transaction = await db.getTransactionById(input.id);
        if (!transaction || transaction.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        const updateData: any = { ...input.data };
        if (input.data.amount !== undefined) {
          updateData.amount = input.data.amount.toString();
        }
        await db.updateTransaction(input.id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const transaction = await db.getTransactionById(input.id);
        if (!transaction || transaction.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        await db.deleteTransaction(input.id);
        return { success: true };
      }),

    // Create manual transaction
    create: protectedProcedure
      .input(z.object({
        date: z.date(),
        description: z.string(),
        amount: z.number(),
        type: z.enum(['income', 'expense']),
        categoryId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createTransaction({
          userId: ctx.user.id,
          date: input.date,
          description: input.description,
          amount: input.amount as any,
          type: input.type,
          categoryId: input.categoryId,
          source: 'manual',
          isVerified: true,
        });
        return { success: true };
      }),
  }),

  // ============ Categories Router ============
  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCategoriesByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(['income', 'expense']),
        color: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createCategory({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          color: z.string().optional(),
          icon: z.string().optional(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        const category = await db.getCategoryById(input.id);
        if (!category || category.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        await db.updateCategory(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const category = await db.getCategoryById(input.id);
        if (!category || category.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        await db.deleteCategory(input.id);
        return { success: true };
      }),
  }),

  // ============ Analytics Router ============
  analytics: router({
    summary: protectedProcedure
      .input(z.object({
        month: z.string().optional(), // YYYY-MM format
      }))
      .query(async ({ ctx, input }) => {
        const transactions = await db.getTransactionsByUserId(ctx.user.id, 10000);
        
        let filtered = transactions;
        if (input.month) {
          filtered = transactions.filter(t => {
            const txMonth = new Date(t.date).toISOString().slice(0, 7);
            return txMonth === input.month;
          });
        }

        const income = filtered
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        const expense = filtered
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        return {
          totalIncome: income,
          totalExpense: expense,
          balance: income - expense,
          transactionCount: filtered.length,
        };
      }),

    monthlyBreakdown: protectedProcedure.query(async ({ ctx }) => {
      const transactions = await db.getTransactionsByUserId(ctx.user.id, 10000);
      
      const breakdown: Record<string, { income: number; expense: number }> = {};
      
      transactions.forEach(t => {
        const month = new Date(t.date).toISOString().slice(0, 7);
        if (!breakdown[month]) {
          breakdown[month] = { income: 0, expense: 0 };
        }
        const amount = parseFloat(t.amount.toString());
        if (t.type === 'income') {
          breakdown[month].income += amount;
        } else {
          breakdown[month].expense += amount;
        }
      });

      return Object.entries(breakdown).map(([month, data]) => ({
        month,
        ...data,
      }));
    }),

    categoryBreakdown: protectedProcedure
      .input(z.object({
        month: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const transactions = await db.getTransactionsByUserId(ctx.user.id, 10000);
        const categories = await db.getCategoriesByUserId(ctx.user.id);

        let filtered = transactions;
        if (input.month) {
          filtered = transactions.filter(t => {
            const txMonth = new Date(t.date).toISOString().slice(0, 7);
            return txMonth === input.month;
          });
        }

        const breakdown: Record<number, { categoryName: string; amount: number }> = {};

        filtered.forEach(t => {
          if (t.categoryId) {
            if (!breakdown[t.categoryId]) {
              const category = categories.find(c => c.id === t.categoryId);
              breakdown[t.categoryId] = {
                categoryName: category?.name || 'Unknown',
                amount: 0,
              };
            }
            breakdown[t.categoryId].amount += parseFloat(t.amount.toString());
          }
        });

        return Object.values(breakdown);
      }),
  }),
});

export type AppRouter = typeof appRouter;
