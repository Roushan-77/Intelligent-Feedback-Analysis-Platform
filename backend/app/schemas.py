from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Sentiment = Literal["positive", "negative", "neutral"]
Severity = Literal["high", "medium", "low"]


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class FeedbackRecord(ApiModel):
    id: str
    text: str
    sentiment: Sentiment
    sentiment_score: float = Field(serialization_alias="sentimentScore")
    aspects: list[str]
    timestamp: str | None = None
    source: str | None = None


class SentimentDistribution(ApiModel):
    positive: int
    negative: int
    neutral: int


class AspectSummary(ApiModel):
    aspect: str
    count: int
    positive: int
    negative: int
    neutral: int


class Insight(ApiModel):
    id: str
    title: str
    description: str
    statistic: str
    aspect: str | None = None
    feedback_ids: list[str] = Field(serialization_alias="feedbackIds")
    severity: Severity


class DateRange(ApiModel):
    start: str
    end: str


class AnalysisMetadata(ApiModel):
    is_demo: bool = Field(False, serialization_alias="isDemo")
    source_filename: str | None = Field(None, serialization_alias="sourceFilename")
    text_column: str | None = Field(None, serialization_alias="textColumn")
    status: Literal["ready", "processing", "error"] = "ready"


class AnalysisResult(ApiModel):
    analysis_id: str = Field(serialization_alias="analysisId")
    analysis_name: str = Field(serialization_alias="analysisName")
    created_at: datetime = Field(serialization_alias="createdAt")
    total_feedback: int = Field(serialization_alias="totalFeedback")
    sentiment_distribution: SentimentDistribution = Field(serialization_alias="sentimentDistribution")
    aspect_summaries: list[AspectSummary] = Field(serialization_alias="aspectSummaries")
    feedback: list[FeedbackRecord]
    insights: list[Insight]
    available_sources: list[str] = Field(serialization_alias="availableSources")
    available_date_range: DateRange | None = Field(None, serialization_alias="availableDateRange")
    metadata: AnalysisMetadata
