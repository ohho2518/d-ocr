# AGENTS.md

> **Single source of truth for every AI coding agent working in this repository.**
> Claude Code, Gemini CLI, Codex, Cursor, and any other agent read this file.
> `CLAUDE.md` and `GEMINI.md` are pointers to this file — do not duplicate content there.

---

## 1. Role

You are an AI coding agent working inside this repository.

Your job: develop, maintain, debug, refactor, document, and improve this project — while **preserving existing behavior** unless the user explicitly asks for a change.

---

## 2. Read Before Every Task

| Order | File | When |
|---|---|---|
| 1 | `AGENTS.md` (this file) | Always |
| 2 | `PROJECT_STATUS.md` | Always — this is the continuity file |
| 3 | `WORKING_RULES.md` | Before touching code, DB, or UI |
| 4 | `CHANGELOG.md` | Only for history, release notes, or debugging past decisions |

**Do not scan the whole repository** unless the task genuinely requires it.

---

## 3. Project Overview

This repository contains two sub-projects. **`ocr_finance_app/` is the primary, working product**; `ocr_poc/` is an earlier Streamlit PoC (currently stubs).

- **Project name:** OCR Finance Manager (`ocr_finance_app`); business concept: SlipScan / SmartReceipt (see `Business_Plan_OCR_Service.md`)
- **Purpose:** Upload receipts, bills, and bank statements; extract financial transactions with Google Gemini Vision OCR; categorize, reconcile, and view them in a personal-finance dashboard.
- **Target users:** Individuals / small businesses tracking income and expenses from paper and digital documents (Thai market focus per the business plan).
- **Main features:** Document upload (Supabase Storage) → Gemini OCR extraction → transaction CRUD → categories → analytics (monthly / category breakdown, income vs expense).
- **Current status:** MVP core features built and Netlify-deployable; enhancements (Excel/PDF export, category UI, budget view, search) remaining. `ocr_poc` pipeline not yet implemented.

> Rule: if information is unclear, write `Need confirmation`. **Never guess.**

---

## 4. Tech Stack

Primary project = `ocr_finance_app` (values below). `ocr_poc` = Python 3.12 / Streamlit / google-generativeai / openpyxl / pillow (PoC, not implemented).

| Item | Value |
|---|---|
| Language | TypeScript (ES modules, `"type": "module"`) |
| Framework | React 19 (client, Vite) + Express 4 + tRPC 11 (server) |
| Runtime | Node.js (dev via `tsx`); Netlify Functions (`serverless-http`) in prod |
| Package manager | pnpm (`pnpm@10`, `pnpm-lock.yaml`) |
| Database | PostgreSQL (Supabase), `postgres` (postgres-js) driver |
| ORM | Drizzle ORM + drizzle-kit (`drizzle/schema.ts`, migrations) |
| Authentication | Supabase Auth + JWT (`jose`); cookie session; OAuth in `server/_core/oauth.ts`; tRPC `protectedProcedure` |
| UI library | Radix UI + Tailwind CSS v4 + shadcn-style components, framer-motion, recharts, wouter (routing), TanStack Query |
| Testing | Vitest (`server/*.test.ts`) |
| Deployment target | Netlify (static client to `dist/public` + `/.netlify/functions/api`) |

---

## 5. Project Structure

```text
d_OCR/                       repo root (git, docs kit)
├─ ocr_finance_app/          PRIMARY app (full-stack TypeScript)
│  ├─ client/                React 19 + Vite frontend
│  │  └─ src/ pages/ components/ hooks/ lib/ contexts/
│  ├─ server/                Express + tRPC backend
│  │  ├─ routers.ts          tRPC routers: documents, transactions, categories, analytics
│  │  ├─ db.ts               Drizzle query helpers
│  │  ├─ storage.ts          Supabase Storage put / signed-url
│  │  ├─ *.test.ts           Vitest suites
│  │  └─ _core/              runtime scaffold (trpc, context, env, oauth, llm, vite…)
│  ├─ shared/                types + constants shared client/server
│  ├─ drizzle/               schema.ts, relations.ts, SQL migrations
│  ├─ netlify/functions/     api.ts (serverless entry)
│  ├─ package.json  vite.config.ts  drizzle.config.ts  vitest.config.ts
│  └─ .env.example
├─ ocr_poc/                  Streamlit Python PoC (Stage 1 — modules are stubs)
│  ├─ app.py  ocr/*.py  prompts/  docs/  requirements.txt
├─ docs/                     ARCHITECTURE / PROJECT_OVERVIEW / RISK_REGISTER (kit)
├─ netlify.toml              base = ocr_finance_app
└─ Business_Plan_OCR_Service.md  ai_team_workflow_ocr_poc_stage_1.md
```

---

## 6. Commands

Only document commands that actually exist in the project. If absent, write `Not found. Need confirmation.`

Run these inside `ocr_finance_app/` (scripts from its `package.json`):

```bash
# Install
pnpm install

# Development (server + Vite middleware)
pnpm run dev          # tsx server/_core/index.ts
pnpm run dev:watch    # same, with file watch

# Build
pnpm run build          # vite build + esbuild bundle server → dist
pnpm run build:netlify  # vite build only (Netlify)

# Test
pnpm test             # vitest run

# Type check
pnpm run check        # tsc --noEmit

# Format
pnpm run format       # prettier --write .

# Database (Drizzle → Supabase Postgres)
pnpm run db:push      # drizzle-kit generate && drizzle-kit migrate
```

`ocr_poc/` (Python PoC — pipeline not yet implemented):

```bash
pip install -r requirements.txt
streamlit run app.py   # currently raises NotImplementedError
```

---

## 7. Environment Variables

From `ocr_finance_app/.env.example`. **Never write real secrets.**

```env
# Backend (Netlify Functions / server)
DATABASE_URL=            # Supabase Postgres connection URI
SUPABASE_URL=            # Supabase project URL
SUPABASE_SERVICE_KEY=    # service_role key — server only, never expose
GEMINI_API_KEY=          # Google Gemini API key
JWT_SECRET=              # session signing secret
OWNER_OPEN_ID=           # Supabase user id that gets admin role

# Frontend (VITE_ prefix = exposed to browser)
VITE_SUPABASE_URL=       # same as SUPABASE_URL
VITE_SUPABASE_ANON_KEY=  # anon/public key (safe to expose)
```

`ocr_poc/.env.example`: `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-2.0-flash`), `GEMINI_FALLBACK_MODEL`, `MAX_IMAGE_SIZE_MB`.

---

## 8. Architecture Notes

Scope: `ocr_finance_app`.

- **Frontend structure:** React 19 SPA in `client/src` — `pages/` (Home dashboard, DocumentUpload, Transactions), `components/`, `hooks/`, Tailwind v4 + Radix, wouter routing, TanStack Query over a tRPC client (`lib/trpc.ts`).
- **Backend structure:** Express server (`server/_core/index.ts`) mounting tRPC (`server/routers.ts`); `db.ts` = Drizzle query helpers; `storage.ts` = Supabase Storage. In prod the same app runs as a Netlify Function via `serverless-http` (`netlify/functions/api.ts`).
- **API structure:** tRPC routers — `documents` (upload, processOCR, list, get), `transactions` (list/get/create/update/delete), `categories` (CRUD), `analytics` (summary, monthlyBreakdown, categoryBreakdown), plus `auth` + `system`. `protectedProcedure` enforces auth and per-user ownership.
- **Database structure:** Supabase Postgres via Drizzle. Tables: `users`, `documents`, `categories`, `transactions`, `matchingResults`, `budgets`. Enums for document/transaction/category/match types & statuses. Migrations in `drizzle/`.
- **Auth flow:** Supabase auth; JWT via `jose`; cookie session resolved in tRPC context; `OWNER_OPEN_ID` maps to admin role.
- **External services:** Supabase (Postgres + Storage + Auth), Google Gemini `gemini-2.0-flash` Vision (`generativelanguage.googleapis.com`), Netlify (hosting/functions). Some `server/_core` modules (image gen, maps, voice) are unused scaffold.
- **OCR flow:** upload → base64 → Supabase Storage → `processOCR` downloads via signed URL → Gemini Vision returns `{ holderName, transactions[] }` JSON → document marked completed + transactions inserted; failures set document `status=failed` with `errorMessage`.
- **Key decisions and why:** migrated off the original Manus/MySQL/mock scaffold to Supabase + real Gemini (May 2026) for a hostable production stack; kept `ocr_poc` as a separate Stage-1 experiment.

---

## 9. Coding Rules

1. Read the relevant files **before** editing.
2. Make the **smallest safe change**.
3. Do not rewrite whole files unless necessary.
4. Preserve existing behavior.
5. Match the existing code style.
6. Do not add dependencies without a stated reason.
7. Do not remove features without user approval.
8. Never hardcode secrets.
9. Prefer clear and maintainable over clever.
10. State your assumption **before** making any major change.

---

## 10. Task Workflow

For **every** task:

1. Read `AGENTS.md` + `PROJECT_STATUS.md`.
2. Identify **only** the files needed for this task.
3. Inspect those files before editing.
4. Back up per `WORKING_RULES.md` if the file is being modified.
5. Make minimal changes.
6. Run tests / lint / build if available.
7. Update `PROJECT_STATUS.md`.
8. Update `CHANGELOG.md` if user-facing behavior changed.
9. Update `AGENTS.md` if architecture, commands, structure, or rules changed.

---

## 11. Context Efficiency

To keep sessions cheap and continuable:

- Do not scan the whole project by default.
- Do not open unrelated files.
- Prefer targeted reads.
- `PROJECT_STATUS.md` is the **main continuity file** — keep it current and concise.
- Move long history to `CHANGELOG.md`.
- Keep `AGENTS.md` about stable rules, **not** daily progress.

---

## 12. Domain Rules

### Database

1. Inspect the schema before changing DB code.
2. Never change schema without a migration strategy.
3. No destructive migrations or data deletion unless explicitly requested.
4. Keep schema, API, types, and UI aligned.
5. Update docs after schema changes.
6. **Back up before any DB change** — see `WORKING_RULES.md`.

### UI

1. Reuse existing components.
2. Keep design and responsive behavior consistent.
3. No redesign unless requested.
4. Log visible behavior changes in `CHANGELOG.md`.

### API

1. Preserve existing request/response contracts unless asked.
2. Validate all input.
3. Handle errors safely; never leak internal errors to users.
4. Update related frontend calls when an API changes.

---

## 13. Common Tasks

**New feature:** understand current flow → locate related files → implement the smallest complete version → add validation + error handling → run checks → update status files.

**Bug fix:** reproduce or understand → find the root cause → fix only the related code → check for side effects → update status.

**Refactor:** preserve behavior → keep it small → never mix refactor with feature changes → run checks.

---

## 14. Never Do

- Commit secrets, API keys, tokens, private keys, or customer data.
- Delete important files.
- Rewrite the whole project.
- Change business logic outside the requested task.
- Upgrade major dependencies without approval.
- Format the entire repository unless requested.
- Guess a command that does not exist in the project.

---

## 15. End-of-Task Report

Always close with:

1. **Files changed**
2. **What changed**
3. **Why**
4. **Checks run** (test / lint / build) and results
5. **Not completed / known issues**
6. **Recommended next step**
