# PulseLens — Intelligent Feedback Analysis Platform

PulseLens turns customer-feedback CSV files into real sentiment, aspect, and evidence-based insight summaries. It is a single-page React application backed by a stateless FastAPI service.

## Main features

- CSV preview, feedback-column selection, and real VADER analysis.
- Sentiment and aspect dashboards, searchable individual feedback, and evidence-linked insights.
- Browser-local IndexedDB history: reopen, delete, clear, JSON export, and validated JSON import.
- One-service Docker/Render deployment: UI and `/api/*` share one URL.

## Tech stack and structure

- React, TypeScript, Vite, Tailwind, Recharts, Lucide.
- FastAPI, Pandas, Pydantic, VADER Sentiment.
- `src/` contains the frontend; `backend/app/` contains the stateless API and analysis modules; `backend/tests/` contains tests.

## Prerequisites

Node.js 20+ and Python 3.12 or 3.13 are the intended local/deployment versions. The current development environment also verified the backend with Python 3.14.

## Run the frontend locally

```bash
npm install
npm run dev
```

`npm run build` runs strict TypeScript validation and produces a production bundle.

## Run the backend locally

Use Python 3.12 or 3.13 for the intended deployment target (the local verification environment used Python 3.14).

```bash
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
$env:PYTHONPATH = "backend"
python -m uvicorn app.main:app --reload --port 8000
```

Open `http://127.0.0.1:8000/api/health` to check the service. The analysis endpoint is `POST /api/analyze` with multipart fields: `file` (a UTF-8 CSV), `textColumn`, and optional `analysisName`.

The actual HTTP form names are `file`, `text_column`, and optional `analysis_name`; the React API client maps its camelCase state to those names. Visit `http://127.0.0.1:8000/docs` to test the API interactively.

Run backend tests with:

```bash
$env:PYTHONPATH = "backend"
python -m pytest backend/tests -q
```

## Browser history and backups

Successful real analyses—and demo data only when explicitly loaded—are saved as complete result snapshots in IndexedDB. Uploaded CSV blobs are never stored. History is specific to this browser and can be cleared when site data is cleared. Export creates a versioned JSON backup; import validates the backup, saves only valid analyses, and skips IDs already stored rather than overwriting them.

## Backend contract

The central contract is in `src/types/analysis.ts`. The endpoint is `POST /api/analyze` as multipart form data containing `file`, `text_column`, and optional `analysis_name`, returning an `AnalysisResult` JSON object. The frontend sends relative `/api/*` requests, so development uses Vite's current origin and the production image uses the single Render service origin.

The service processes CSV bytes in memory only. It has a 5 MB upload limit and a 10,000-row limit. It uses VADER's compound score with standard thresholds and transparent keyword-based aspect matching; this is not a trained topic model and may be less reliable for sarcasm, domain language, and non-English text.