import urllib.request
import urllib.parse
import re
import os
import sys
import ssl
from html.parser import HTMLParser

url = "https://web.bisemultan.edu.pk/question-papers-with-key-ssc-part-i-9th-1st-annual-2026-examination/"
print(f"Fetching URL: {url}")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    url,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
)

try:
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
except Exception as e:
    print(f"Error fetching URL: {e}")
    sys.exit(1)

print(f"Fetched HTML size: {len(html)} bytes")

# Parse HTML with regex / HTMLParser to extract table rows
# Look for <table ... </table>
table_matches = re.findall(r'<table[^>]*>(.*?)</table>', html, re.DOTALL | re.IGNORECASE)
print(f"Found {len(table_matches)} tables in page")

papers = []

for t_idx, table_html in enumerate(table_matches):
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', table_html, re.DOTALL | re.IGNORECASE)
    for r_idx, row_html in enumerate(rows):
        # Extract td / th
        cells = re.findall(r'<(?:td|th)[^>]*>(.*?)</(?:td|th)>', row_html, re.DOTALL | re.IGNORECASE)
        # Clean text
        clean_cells = [re.sub(r'<[^>]+>', ' ', c).strip() for c in cells]
        
        # Extract links inside row
        link_matches = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', row_html, re.DOTALL | re.IGNORECASE)
        
        for href, link_text in link_matches:
            clean_link_text = re.sub(r'<[^>]+>', ' ', link_text).strip()
            # Absolute URL
            abs_url = urllib.parse.urljoin(url, href)
            papers.append({
                "table_idx": t_idx,
                "row_cells": clean_cells,
                "link_text": clean_link_text,
                "url": abs_url
            })

print(f"Extracted {len(papers)} links from tables")
for p in papers[:20]:
    print(p)
