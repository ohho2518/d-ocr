import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  boolean,
  json,
  integer,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const documentTypeEnum = pgEnum("document_type", ["receipt", "bill", "bank_statement", "other"]);
export const documentStatusEnum = pgEnum("document_status", ["pending", "processing", "completed", "failed"]);
export const categoryTypeEnum = pgEnum("category_type", ["income", "expense"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense"]);
export const transactionSourceEnum = pgEnum("transaction_source", ["receipt", "bill", "bank_statement", "manual"]);
export const matchTypeEnum = pgEnum("match_type", ["exact", "fuzzy", "no_match"]);
export const matchStatusEnum = pgEnum("match_status", ["matched", "review", "mismatch"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdateFn(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Document table for storing uploaded receipts, bills, and bank statements
 */
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(),
  documentType: documentTypeEnum("documentType").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
  status: documentStatusEnum("status").default("pending").notNull(),
  ocrData: json("ocrData"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Category table for expense/income categorization
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: categoryTypeEnum("type").notNull(),
  color: varchar("color", { length: 7 }),
  icon: varchar("icon", { length: 50 }),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Transaction table for storing extracted financial transactions
 */
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  documentId: integer("documentId"),
  date: timestamp("date").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  categoryId: integer("categoryId"),
  source: transactionSourceEnum("source").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  isVerified: boolean("isVerified").default(false),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Matching result table for reconciliation between different sources
 */
export const matchingResults = pgTable("matchingResults", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  transaction1Id: integer("transaction1Id").notNull(),
  transaction2Id: integer("transaction2Id").notNull(),
  matchScore: decimal("matchScore", { precision: 3, scale: 2 }).notNull(),
  matchType: matchTypeEnum("matchType").notNull(),
  dateVariance: integer("dateVariance"),
  amountVariance: decimal("amountVariance", { precision: 15, scale: 2 }),
  status: matchStatusEnum("status").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export type MatchingResult = typeof matchingResults.$inferSelect;
export type InsertMatchingResult = typeof matchingResults.$inferInsert;

/**
 * Budget table for tracking budget vs actual spending
 */
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  categoryId: integer("categoryId").notNull(),
  month: varchar("month", { length: 7 }),
  budgetAmount: decimal("budgetAmount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;
