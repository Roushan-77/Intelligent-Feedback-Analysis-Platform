import hashlib
import logging
import os
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .analysis.aspects import ASPECT_KEYWORDS, detect
from .analysis.csv_processor import CsvValidationError, read_feedback_csv
from .analysis.insights import generate
from .analysis.sentiment import classify
from .schemas import AnalysisMetadata, AnalysisResult, AspectSummary, DateRange, FeedbackRecord, SentimentDistribution

logger = logging.getLogger(__name__)
app = FastAPI(title="PulseLens Analysis API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["GET", "POST"], allow_headers=["*"])


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "pulselens-analysis"}


def _safe_cell(value: object) -> str | None:
    if value is None or pd.isna(value):
        return None
    value = str(value).strip()
    return value or None


def build_analysis(raw: bytes, filename: str, text_column: str | None, analysis_name: str | None) -> AnalysisResult:
    frame, resolved_text_column, source_column, date_column = read_feedback_csv(raw, text_column)
    records: list[FeedbackRecord] = []
    parsed_dates: list[datetime] = []
    for position, (_, row) in enumerate(frame.iterrows(), start=1):
        text = str(row[resolved_text_column]).strip()
        sentiment, score = classify(text)
        timestamp: str | None = None
        if date_column:
            parsed = pd.to_datetime(row[date_column], errors="coerce", utc=True)
            if not pd.isna(parsed):
                parsed_datetime = parsed.to_pydatetime()
                parsed_dates.append(parsed_datetime)
                timestamp = parsed_datetime.isoformat().replace("+00:00", "Z")
        records.append(FeedbackRecord(id=f"record-{position}", text=text, sentiment=sentiment, sentiment_score=score, aspects=detect(text), timestamp=timestamp, source=_safe_cell(row[source_column]) if source_column else None))
    distribution = Counter(record.sentiment for record in records)
    summaries: list[AspectSummary] = []
    for aspect in ASPECT_KEYWORDS:
        matches = [record for record in records if aspect in record.aspects]
        if matches:
            by_sentiment = Counter(record.sentiment for record in matches)
            summaries.append(AspectSummary(aspect=aspect, count=len(matches), positive=by_sentiment["positive"], negative=by_sentiment["negative"], neutral=by_sentiment["neutral"]))
    summaries.sort(key=lambda item: (-item.count, item.aspect))
    digest = hashlib.sha256(raw).hexdigest()[:12]
    return AnalysisResult(
        analysis_id=f"analysis-{digest}", analysis_name=analysis_name.strip() if analysis_name and analysis_name.strip() else filename.rsplit(".", 1)[0], created_at=datetime.now(UTC),
        total_feedback=len(records), sentiment_distribution=SentimentDistribution(positive=distribution["positive"], negative=distribution["negative"], neutral=distribution["neutral"]),
        aspect_summaries=summaries, feedback=records, insights=generate(summaries, records), available_sources=sorted({record.source for record in records if record.source}),
        available_date_range=DateRange(start=min(parsed_dates).isoformat().replace("+00:00", "Z"), end=max(parsed_dates).isoformat().replace("+00:00", "Z")) if parsed_dates else None,
        metadata=AnalysisMetadata(source_filename=filename, text_column=resolved_text_column),
    )


@app.post("/api/analyze", response_model=AnalysisResult, response_model_by_alias=True)
async def analyze(file: UploadFile = File(...), text_column: str | None = Form(None), analysis_name: str | None = Form(None)) -> AnalysisResult:
    filename = file.filename or "feedback.csv"
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only CSV files are supported.")
    raw = await file.read()
    try:
        return build_analysis(raw, filename, text_column, analysis_name)
    except CsvValidationError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except Exception:
        logger.exception("Feedback analysis failed for uploaded file metadata only: %s", filename)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Analysis could not be completed. Please try a valid CSV.") from None


# In production the single service serves Vite's compiled assets. Development keeps
# this inactive until a dist directory is explicitly built or supplied by the container.
frontend_dist = Path(os.getenv("FRONTEND_DIST", Path(__file__).resolve().parents[2] / "dist"))
if frontend_dist.is_dir():
    assets_dir = frontend_dist / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def frontend(full_path: str) -> FileResponse:
        if full_path == "api" or full_path.startswith("api/"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API endpoint not found.")
        candidate = frontend_dist / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(frontend_dist / "index.html")
