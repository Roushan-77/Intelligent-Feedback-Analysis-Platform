import pytest

from app.analysis.csv_processor import CsvValidationError, read_feedback_csv
from app.analysis.sentiment import classify
from app.main import build_analysis, health


def analyze(data: str, column: str | None = "feedback"):
    return build_analysis(data.encode(), "feedback.csv", column, "Test pulse")


def test_health():
    assert health()["status"] == "healthy"


def test_vader_positive_negative_and_neutral_labels():
    assert classify("I love this excellent product!")[0] == "positive"
    assert classify("This is terrible and I hate it.")[0] == "negative"
    assert classify("The product was released on Tuesday.")[0] == "neutral"


def test_reliability_terms_and_insight_evidence_match_claims():
    result = analyze("feedback\nThe app is crashing with bugs and downtime.\nThe layout is fine.\n")
    reliability = next(item for item in result.aspect_summaries if item.aspect == "Reliability")
    assert reliability.count == 1
    assert "Reliability" in result.feedback[0].aspects
    for insight in result.insights:
        evidence = [item for item in result.feedback if item.id in insight.feedback_ids]
        if insight.aspect and "negative" in insight.statistic:
            assert evidence and all(insight.aspect in item.aspects and item.sentiment == "negative" for item in evidence)
        if insight.id == "overall-sentiment":
            assert all(item.sentiment == "negative" for item in evidence)


def test_analysis_matches_frontend_contract_and_metrics():
    body = analyze("feedback,timestamp,source\nI love the intuitive dashboard,2026-01-02,Survey\nThe app crashes and is painfully slow,2026-01-03,Email\nIt is okay,2026-01-04,Survey\n").model_dump(by_alias=True)
    assert {"analysisId", "analysisName", "createdAt", "totalFeedback", "sentimentDistribution", "aspectSummaries", "feedback", "insights", "availableSources", "metadata"} <= body.keys()
    assert body["totalFeedback"] == 3
    assert sum(body["sentimentDistribution"].values()) == 3
    assert body["metadata"]["isDemo"] is False
    assert body["availableDateRange"]["start"].startswith("2026-01-02")
    assert any(item["aspect"] == "Performance" for item in body["aspectSummaries"])
    assert any(item["aspect"] == "Reliability" for item in body["aspectSummaries"])
    assert all(identifier in {record["id"] for record in body["feedback"]} for insight in body["insights"] for identifier in insight["feedbackIds"])


def test_empty_cells_are_excluded_and_multiple_aspects_match():
    body = analyze("feedback\n\nSupport is slow and the pricing is expensive\n   \n").model_dump(by_alias=True)
    assert body["totalFeedback"] == 1
    assert {"Customer Support", "Performance", "Pricing"} <= set(body["feedback"][0]["aspects"])


def test_missing_or_incorrect_text_column_returns_helpful_error():
    with pytest.raises(CsvValidationError, match="Available columns"):
        analyze("comment\nWorks great\n", "feedback")


def test_no_automatic_column_is_a_validation_error():
    with pytest.raises(CsvValidationError):
        analyze("rating\n5\n", None)


def test_invalid_csv_is_rejected():
    with pytest.raises(CsvValidationError):
        read_feedback_csv(b'feedback\n"unclosed', "feedback")
