from io import StringIO

import pandas as pd

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_ROWS = 10_000
LIKELY_TEXT_COLUMNS = ("feedback", "review", "comment", "text", "message", "response")
LIKELY_SOURCE_COLUMNS = ("source", "channel", "platform")
LIKELY_DATE_COLUMNS = ("date", "timestamp", "created_at", "submitted_at", "created", "submitted")


class CsvValidationError(ValueError):
    pass


def _find_column(columns: list[str], likely: tuple[str, ...]) -> str | None:
    normalized = {column.casefold().strip(): column for column in columns}
    for candidate in likely:
        if candidate in normalized:
            return normalized[candidate]
    return None


def read_feedback_csv(raw: bytes, selected_column: str | None) -> tuple[pd.DataFrame, str, str | None, str | None]:
    if not raw:
        raise CsvValidationError("The uploaded CSV is empty.")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise CsvValidationError("The CSV exceeds the 5 MB upload limit.")
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise CsvValidationError("The CSV must be UTF-8 encoded.") from error
    try:
        frame = pd.read_csv(StringIO(text), on_bad_lines="error")
    except Exception as error:
        raise CsvValidationError("The file could not be parsed as a valid CSV.") from error
    if frame.empty or not list(frame.columns):
        raise CsvValidationError("The CSV needs a header row and at least one data row.")
    if len(frame) > MAX_ROWS:
        raise CsvValidationError(f"The CSV exceeds the {MAX_ROWS:,}-row limit.")
    columns = [str(column).strip() for column in frame.columns]
    frame.columns = columns
    text_column = selected_column.strip() if selected_column else _find_column(columns, LIKELY_TEXT_COLUMNS)
    if not text_column or text_column not in columns:
        available = ", ".join(columns[:15])
        raise CsvValidationError(f"Feedback column was not found. Available columns: {available}.")
    usable = frame[text_column].notna() & frame[text_column].astype(str).str.strip().ne("")
    frame = frame.loc[usable].copy()
    if frame.empty:
        raise CsvValidationError("The selected feedback column contains no usable feedback.")
    return frame, text_column, _find_column(columns, LIKELY_SOURCE_COLUMNS), _find_column(columns, LIKELY_DATE_COLUMNS)
