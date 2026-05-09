CREATE TYPE "public"."category_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('receipt', 'bill', 'bank_statement', 'other');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('matched', 'review', 'mismatch');--> statement-breakpoint
CREATE TYPE "public"."match_type" AS ENUM('exact', 'fuzzy', 'no_match');--> statement-breakpoint
CREATE TYPE "public"."transaction_source" AS ENUM('receipt', 'bill', 'bank_statement', 'manual');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"categoryId" integer NOT NULL,
	"month" varchar(7),
	"budgetAmount" numeric(15, 2) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "category_type" NOT NULL,
	"color" varchar(7),
	"icon" varchar(50),
	"isDefault" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"fileKey" varchar(255) NOT NULL,
	"fileUrl" varchar(512) NOT NULL,
	"documentType" "document_type" NOT NULL,
	"uploadedAt" timestamp DEFAULT now() NOT NULL,
	"processedAt" timestamp,
	"status" "document_status" DEFAULT 'pending' NOT NULL,
	"ocrData" json,
	"confidence" numeric(3, 2),
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matchingResults" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"transaction1Id" integer NOT NULL,
	"transaction2Id" integer NOT NULL,
	"matchScore" numeric(3, 2) NOT NULL,
	"matchType" "match_type" NOT NULL,
	"dateVariance" integer,
	"amountVariance" numeric(15, 2),
	"status" "match_status" NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"documentId" integer,
	"date" timestamp NOT NULL,
	"description" text,
	"amount" numeric(15, 2) NOT NULL,
	"type" "transaction_type" NOT NULL,
	"categoryId" integer,
	"source" "transaction_source" NOT NULL,
	"confidence" numeric(3, 2),
	"isVerified" boolean DEFAULT false,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
