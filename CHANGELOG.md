# Changelog

All notable changes to ScribeRx will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.0.0] — 2026-07-01

### Added
- Full-stack application: React 19 frontend + Express backend with Google Gemini VLM integration.
- Prescription image upload with drag-and-drop and preset handwriting samples.
- FR-1: Image preprocessing pipeline (brightness, contrast, CLAHE equalization).
- FR-2/FR-3: Multimodal VLM extraction via Gemini with structured JSON schema validation.
- FR-4: Inventory management with Levenshtein fuzzy matching (>= 85% threshold) and automatic stock deduction.
- FR-5: Medication intake alert scheduling and low-stock replenishment warnings.
- Canvas-based prescription renderer with three clinical preset templates.
- Production-grade `README.md`, `CONTRIBUTING.md`, `LICENSE` (MIT), and `.editorconfig`.
- Comprehensive `.gitignore` for Node.js/TypeScript/Vite projects.
- SEO-optimised `index.html` with meta tags, OG properties, and SVG favicon.

### Changed
- `package.json` name corrected from `react-example` to `scriberx`, version set to `1.0.0`.
- `index.html` title corrected from "My Google AI Studio App" to "ScribeRx | AI Prescription Analyser".
- Footer text replaced: removed fabricated "Celery Worker" / "Redis Queue" / "Antigravity Framework" references with accurate system status labels.
- Header metrics relabeled from "Extraction Accuracy" / "Pipeline Latency" to "Target Accuracy" / "Avg. Latency".
- Unused imports removed from `App.tsx` (`PlusCircle`, `CheckCircle`, `RefreshCw`).

### Documentation
- JSDoc docstrings added to all components, utility modules, server routes, and type definitions.
- `CHANGELOG.md` rewritten to follow Keep a Changelog format.

### Files Affected
- `index.html`, `package.json`, `.editorconfig` (new), `CHANGELOG.md`
- `src/App.tsx`, `src/types.ts`, `src/db.ts`, `src/main.tsx`, `src/index.css`
- `src/components/UploadZone.tsx`, `PreprocessingViewer.tsx`, `AnalysisResults.tsx`, `InventoryManager.tsx`, `AlertsConsole.tsx`
- `src/utils/prescriptionCanvas.ts`
- `server.ts`, `README.md`, `CONTRIBUTING.md`, `LICENSE`
