# Changelog

All notable, **user-facing** changes to this project.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/)

> Internal refactors and status updates belong in `PROJECT_STATUS.md`, not here.

---

## [Unreleased]

### Added
- Documentation kit: `AGENTS.md`, `PROJECT_STATUS.md`, `WORKING_RULES.md`, `ENVIRONMENT.md`, `docs/`, `prompts/`.

### Changed
- Docs synced to the existing codebase: `PROJECT_STATUS.md` and `AGENTS.md` (§3 overview, §4 tech stack, §5 structure, §6 commands, §7 env, §8 architecture) now describe the real `ocr_finance_app` (TypeScript / React 19 / tRPC / Drizzle + Supabase / Gemini Vision OCR, Netlify) and the `ocr_poc` Streamlit PoC, replacing the "no code exists" bootstrap placeholders.
- Merged duplicate `AGENTS.md` / `GEMINI.md` agent templates into one `AGENTS.md`.

### Removed
- Nothing. Prior material moved to `_archive/`.

---

<!--
Template for each release:

## [1.0.0] - YYYY-MM-DD

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
-->
