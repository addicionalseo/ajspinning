#!/usr/bin/env python3
import re
from pathlib import Path
from html import unescape

ROOT = Path(__file__).resolve().parent.parent
SITEMAP = ROOT / "sitemap.xml"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def strip_html(text: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text, re.UNICODE))


def page_url(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel.endswith("/index.html"):
        rel = rel[: -len("index.html")]
    elif rel == "index.html":
        rel = ""
    return f"https://ajspinning.com/{rel}"


def extract_sitemap_urls() -> set[str]:
    xml = read_text(SITEMAP)
    return set(re.findall(r"<loc>(https://ajspinning\.com/[^<]*)</loc>", xml))


def extract_robots_meta(text: str) -> str:
    match = re.search(r'<meta name="robots" content="([^"]+)"', text, flags=re.I)
    return match.group(1).strip() if match else ""


def audit() -> None:
    html_files = [
        path
        for path in ROOT.rglob("index.html")
        if "tmp" not in path.parts and "out" not in path.parts
    ]
    sitemap_urls = extract_sitemap_urls()
    noindex_pages = []
    sitemap_noindex = []

    print("URL\tWORDS\tROBOTS\tIN_SITEMAP")
    for path in sorted(html_files):
        text = read_text(path)
        robots = extract_robots_meta(text)
        words = word_count(strip_html(text))
        url = page_url(path)
        in_sitemap = url in sitemap_urls
        print(f"{url}\t{words}\t{robots or '-'}\t{in_sitemap}")

        if "noindex" in robots.lower():
            noindex_pages.append(url)
            if in_sitemap:
                sitemap_noindex.append(url)

    print("\nNOINDEX_PAGES")
    for url in noindex_pages:
        print(url)

    print("\nSITEMAP_CONTAINS_NOINDEX")
    for url in sitemap_noindex:
        print(url)


if __name__ == "__main__":
    audit()
