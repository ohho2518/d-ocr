# PROJECT_STATUS.md

> **The continuity file.** Every AI session reads this first and updates it last.
> Keep it short. Long history goes to `CHANGELOG.md`.

**Last updated:** 2026-07-19
**Updated by:** Claude (docs synced to existing code)

---

## Current State

Active codebase (~120 TS/TSX/Python source files). The repo holds **two sub-projects**:

1. **`ocr_finance_app/`** — the real, working product. A full-stack TypeScript web app that OCRs receipts / bills / bank statements with Google Gemini Vision, extracts transactions, and shows a personal-finance dashboard. MVP core features are built and deployable to Netlify. **This is the primary project.**
2. **`ocr_poc/`** — an earlier Streamlit + Python Stage-1 proof-of-concept (Thai handwritten docs → Excel). Well specified and scaffolded, but the pipeline modules are still **stubs** (`raise NotImplementedError`). Effectively superseded by `ocr_finance_app`.

Business context in `Business_Plan_OCR_Service.md` (Thai) — SlipScan / SmartReceipt service concept.

---

## Completed

### `ocr_finance_app` (evidenced by code)
- [x] Postgres schema via Drizzle: `users`, `documents`, `categories`, `transactions`, `matchingResults`, `budgets` (`drizzle/schema.ts`, 2 migrations)
- [x] Supabase Storage upload + signed-URL download (`server/storage.ts`)
- [x] Real Gemini 2.0 Flash Vision OCR extraction, incl. holder-name + per-row confidence (`server/routers.ts` → `documents.processOCR`)
- [x] tRPC API: `documents`, `transactions`, `categories`, `analytics` routers + auth (`server/routers.ts`)
- [x] React 19 + Vite client: dashboard, document upload (drag-drop), transaction table, pastel/wireframe design system (`client/src/pages`, `client/src/components`)
- [x] Analytics: monthly + category breakdown, income/expense summary
- [x] Vitest test suites present (`server/*.test.ts`: analytics, categories, documents, transactions, auth.logout)
- [x] Netlify serverless deployment wiring (`netlify.toml`, `netlify/functions/api.ts`)
- [x] Infra migration done: Manus S3 → Supabase Storage; MySQL → Supabase Postgres; mock → real Gemini

### `ocr_poc`
- [x] Stage-1 spec, decision log, prompt library, task board (`ocr_poc/docs/`)
- [x] Package scaffold + pinned `requirements.txt` (Streamlit, google-generativeai, pillow, openpyxl)

---

## In Progress / Remaining

### `ocr_finance_app` (from `todo.md`, "future enhancement")
- [ ] Category management UI
- [ ] Data export (Excel / PDF)
- [ ] Budget-vs-actual comparison view (table exists, UI not built)
- [ ] Advanced search / filtering
- [ ] Testing & polish, responsive pass, perf optimization
- [ ] User docs / demo

### `ocr_poc` (all pipeline modules are stubs)
- [ ] Implement `app.py`, `ocr/preprocess.py`, `gemini_engine.py`, `json_cleanup.py`, `postprocess.py`, `excel_export.py`, `verifier.py`

---

## Next Recommended Task

Decide whether `ocr_poc` is retired in favour of `ocr_finance_app`. If the finance app is the path forward, pick the top item from its remaining list (Excel/PDF export or category-management UI) since transactions and analytics already exist.

---

## Known Issues

- `ocr_finance_app/.env` is present in the working tree — contains live config; must never be committed (see `WORKING_RULES.md` Rule 8; it is gitignored).
- `ocr_poc` pipeline is non-functional (stubs raise `NotImplementedError`).
- `server/_core/` retains Manus-scaffold modules (imageGeneration, map, voiceTranscription, etc.) unrelated to OCR — dead weight, not wired into finance features.

---

## Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 2026-05-09 | Storage → Supabase; DB → Supabase Postgres; OCR → real Gemini 2.0 Flash | Move PoC scaffold to a real, hostable stack |
| 2026-05-11 | `ocr_poc` kept as Stage-1 Streamlit PoC with its own spec/decision log | Separate experiment track (Thai handwritten → Excel) |
| 2026-07-14 | `AGENTS.md` is the single source of truth; `CLAUDE.md` / `GEMINI.md` are pointers | Previously two near-identical files drifted apart |
| 2026-07-19 | Docs synced to the actual code (this file, `AGENTS.md`, `CHANGELOG.md`) | Bootstrap template said "no code exists", which was false |

---

## How to Update This File

At the end of every meaningful task, record:

- What was completed
- Which files changed
- What remains unfinished
- Next recommended task
- Any known issue
- Any decision made and why

This lets the next AI session continue **without re-reading the whole repository.**
