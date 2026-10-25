from collections.abc import Sequence

from ..schemas import AspectSummary, FeedbackRecord, Insight


def generate(aspects: Sequence[AspectSummary], feedback: Sequence[FeedbackRecord]) -> list[Insight]:
    """Create cautious, traceable insights from actual aspect-level evidence."""
    insights: list[Insight] = []
    for summary in sorted(aspects, key=lambda item: (item.negative, item.count), reverse=True):
        if summary.negative == 0:
            continue
        related = [item.id for item in feedback if summary.aspect in item.aspects and item.sentiment == "negative"]
        if summary.negative >= 2:
            severity = "high" if summary.negative / summary.count >= 0.5 else "medium"
            insights.append(Insight(
                id=f"negative-{summary.aspect.lower().replace(' ', '-')}",
                title=f"{summary.aspect} needs attention",
                description=f"{summary.negative} of {summary.count} feedback entries mentioning {summary.aspect} are negative.",
                statistic=f"{summary.negative} negative of {summary.count} {summary.aspect} mentions",
                aspect=summary.aspect, feedback_ids=related[:5], severity=severity,
            ))
            break
    for summary in sorted(aspects, key=lambda item: (item.positive, item.count), reverse=True):
        if summary.positive >= 2 and summary.positive > summary.negative:
            related = [item.id for item in feedback if summary.aspect in item.aspects and item.sentiment == "positive"]
            insights.append(Insight(
                id=f"positive-{summary.aspect.lower().replace(' ', '-')}",
                title=f"{summary.aspect} is a relative strength",
                description=f"Positive feedback outweighs negative feedback for this recurring aspect.",
                statistic=f"{summary.positive} positive of {summary.count} {summary.aspect} mentions",
                aspect=summary.aspect, feedback_ids=related[:5], severity="low",
            ))
            break
    if not insights:
        negative_records = [item for item in feedback if item.sentiment == "negative"]
        negative = len(negative_records)
        insights.append(Insight(
            id="overall-sentiment", title="Early feedback baseline", description="The dataset is small or has limited repeated aspect evidence, so this is a high-level summary.",
            statistic=f"{negative} negative of {len(feedback)} analyzed feedback entries", feedback_ids=[item.id for item in negative_records[:5]], severity="low",
        ))
    return insights
