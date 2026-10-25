from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()


def classify(text: str) -> tuple[str, float]:
    """Return a VADER label and compound score using standard thresholds."""
    score = round(float(_analyzer.polarity_scores(text)["compound"]), 4)
    if score >= 0.05:
        return "positive", score
    if score <= -0.05:
        return "negative", score
    return "neutral", score
