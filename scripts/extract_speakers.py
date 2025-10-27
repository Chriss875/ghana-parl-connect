#!/usr/bin/env python3
"""
Extract speaker names from PDFs in a folder.
Scans for honorifics like 'Hon.' or 'Honorable' and collects unique names in the format used by the UI: 'Hon. First Last'.

Usage:
  python scripts/extract_speakers.py /path/to/pdf/folder /path/to/output.txt

If output path is omitted, prints results to stdout.
"""
import sys
import re
import os
from pathlib import Path
from typing import Set, List

def _lazy_extract_text(path: str):
    try:
        import importlib
        mod = importlib.import_module('pdfminer.high_level')
        extract_text = getattr(mod, 'extract_text')
    except Exception:
        raise RuntimeError("pdfminer.six is required. Install with: python -m pip install pdfminer.six")
    return extract_text

HON_PATTERN = re.compile(
    r"\b(Hon(?:\.|orable)?)(?:\s+|\s*,\s*)([A-Z][A-Za-zÀ-ÖØ-öø-ÿ'\-]+(?:\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ'\-]+){0,3})",
    flags=re.MULTILINE,
)

def clean_name(hon: str, rest: str) -> str:
    # Normalize honorific to 'Hon.' and collapse whitespace
    hon_norm = 'Hon.'
    name = ' '.join(rest.split())
    return f"{hon_norm} {name}"


def extract_from_pdf(path: Path) -> List[str]:
    try:
        text = _lazy_extract_text(str(path))(str(path))
    except Exception as e:
        print(f"Failed to extract text from {path}: {e}")
        return []
    matches = HON_PATTERN.findall(text)
    cleaned = [clean_name(h, r) for (h, r) in matches]
    return cleaned


def find_pdfs(folder: Path) -> List[Path]:
    pdfs = []
    for p in folder.rglob('*.pdf'):
        pdfs.append(p)
    return sorted(pdfs)


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/extract_speakers.py /path/to/pdf/folder [output.txt]")
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
        names = extract_from_pdf(pdf)
        for n in names:
            unique.add(n)

    # Normalize: remove duplicates with different spacing/cases
    normalized = {}
    for n in unique:
        key = re.sub(r"\s+", " ", n).strip()
        normalized[key] = key

    final = sorted(normalized.values(), key=lambda s: s.split()[-1])

    if out_path:
        try:
            out_path.parent.mkdir(parents=True, exist_ok=True)
            with open(out_path, 'w', encoding='utf-8') as f:
                for name in final:
                    f.write(name + '\n')
            print(f"Wrote {len(final)} unique speaker names to {out_path}")
        except Exception as e:
            print(f"Failed to write output: {e}")
    else:
        for name in final:
            print(name)

if __name__ == '__main__':
    main()
