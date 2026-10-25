import re

ASPECT_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Performance": ("slow", "slower", "lag", "laggy", "loading time", "load time", "performance", "speed", "takes forever", "unresponsive", "latency"),
    "User Interface": ("interface", "layout", "design", "appearance", "dashboard", "navigation", "ui", "screen", "menu"),
    "Pricing": ("price", "pricing", "expensive", "cost", "subscription", "billing", "refund", "plan", "annual"),
    "Customer Support": ("support", "customer service", "response time", "representative", "help desk", "helpdesk", "agent", "ticket"),
    "Reliability": ("crash", "crashes", "crashing", "error", "errors", "bug", "bugs", "failure", "failed", "failing", "broken", "unstable", "downtime", "freeze", "freezes", "login"),
    "Features": ("feature", "features", "functionality", "missing option", "capability", "integration", "export", "bulk editing", "collaboration"),
    "Usability": ("easy to use", "confusing", "difficult to use", "intuitive", "complicated", "user-friendly", "straightforward", "easy to learn", "workflow"),
}


def detect(text: str) -> list[str]:
    normalized = text.casefold()
    matches: list[str] = []
    for aspect, phrases in ASPECT_KEYWORDS.items():
        if any(re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", normalized) for phrase in phrases):
            matches.append(aspect)
    return matches
