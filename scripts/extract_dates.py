#!/usr/bin/env python3
"""
Extract dates from PDFs in a folder.

This script uses pdfminer.six to pull text and then searches for common date patterns.
It attempts to normalize found dates to an ordinal form (e.g. "1st July 2025").

Usage:
  python scripts/extract_dates.py /path/to/pdf/folder /path/to/output.txt

If output path is omitted, results are printed to stdout.
"""
import sys
import re
from pathlib import Path
from datetime import datetime
from typing import Set, List

def _lazy_extract_text(path: str):
    try:
        import importlib
        mod = importlib.import_module('pdfminer.high_level')
        extract_text = getattr(mod, 'extract_text')
    except Exception:
        raise RuntimeError("pdfminer.six is required. Install with: python -m pip install pdfminer.six")
    return extract_text


DATE_PATTERNS = [
    # Matches: 1 July 2025, 01 July 2025, 1st July 2025
    re.compile(r"\b(\d{1,2})(?:st|nd|rd|th)?[\s\-./]?(?:of[\s])?(January|February|March|April|May|June|July|August|September|October|November|December)[\s,.-]+(\d{4})\b", re.I),
    # Matches: July 1, 2025 or July 01 2025
    re.compile(r"\b(January|February|March|April|May|June|July|August|September|October|November|December)[\s.-]+(\d{1,2})(?:st|nd|rd|th)?,?[\s.-]+(\d{4})\b", re.I),
    # Matches: 2025-07-01 or 2025/07/01
    re.compile(r"\b(\d{4})[\-/](\d{1,2})[\-/](\d{1,2})\b"),
]


def ordinal(n: int) -> str:
    s = ["th", "st", "nd", "rd"]
    v = n % 100
    return f"{n}{s[(v - 20) % 10] if (v - 20) % 10 in range(4) else (s[v] if v in (11,12,13) else s[0])}"


def normalize_date_match(match: re.Match) -> str | None:
    try:
        # Try pattern 1: day, month, year
        if match.re.pattern.startswith('\\b(\\d{1,2}'):
            day = int(match.group(1))
            month = match.group(2)
            year = int(match.group(3))
            dt = datetime.strptime(f"{day} {month} {year}", "%d %B %Y")
            return f"{ordinal(dt.day)} {dt.strftime('%B %Y')}"

        # Pattern 2: month day, year
        if match.re.pattern.startswith('\\b(January'):
            month = match.group(1)
            day = int(match.group(2))
            year = int(match.group(3))
            dt = datetime.strptime(f"{day} {month} {year}", "%d %B %Y")
            return f"{ordinal(dt.day)} {dt.strftime('%B %Y')}"

        # Pattern 3: yyyy-mm-dd
        if match.re.pattern.startswith('\\b(\\d{4}'):
            year = int(match.group(1))
            month = int(match.group(2))
            day = int(match.group(3))
            dt = datetime(year, month, day)
            return f"{ordinal(dt.day)} {dt.strftime('%B %Y')}"
    except Exception:
        return None
    return None


def extract_dates_from_text(text: str) -> List[str]:
    found: Set[str] = set()
    for pat in DATE_PATTERNS:
        for m in pat.finditer(text):
            norm = normalize_date_match(m)
            if norm:
                found.add(norm)
    return sorted(found)


def extract_from_pdf(path: Path) -> List[str]:
    try:
        text = _lazy_extract_text(str(path))(str(path))
    except Exception as e:
        print(f"Failed to extract text from {path}: {e}")
        return []
    return extract_dates_from_text(text)


def find_pdfs(folder: Path) -> List[Path]:
    return sorted(folder.rglob('*.pdf'))


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/extract_dates.py /path/to/pdf/folder [output.txt]")
        sys.exit(1)
    folder = Path(sys.argv[1]).expanduser()
    if not folder.exists():
        print(f"Folder does not exist: {folder}")
        sys.exit(1)

    out_path = None
    if len(sys.argv) >= 3:
        out_path = Path(sys.argv[2]).expanduser()

    pdfs = find_pdfs(folder)
    if not pdfs:
        print(f"No PDFs found under {folder}")
        sys.exit(0)

    unique: Set[str] = set()
    for pdf in pdfs:
        print(f"Processing {pdf}...")
        dates = extract_from_pdf(pdf)
        for d in dates:
            unique.add(d)

    final = sorted(unique)

    if out_path:
        try:
            out_path.parent.mkdir(parents=True, exist_ok=True)
            with open(out_path, 'w', encoding='utf-8') as f:
                for d in final:
                    f.write(d + '\n')
            print(f"Wrote {len(final)} unique dates to {out_path}")
        except Exception as e:
            print(f"Failed to write output: {e}")
    else:
        for d in final:
            print(d)


if __name__ == '__main__':
    main()
