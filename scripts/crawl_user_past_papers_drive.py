import urllib.request
import urllib.parse
import re
import json
import ssl
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

folder_id = "1raZrp9C__6F6zxnB_o6jPLRtgBFinRl_"
print(f"1. Scanning Google Drive folder: {folder_id}")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch_folder_items(f_id, sort_dir="a"):
    url = f"https://drive.google.com/drive/folders/{f_id}?sort=14&direction={sort_dir}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    )
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        
    m = re.search(r'window\[\'_DRIVE_ivd\'\]\s*=\s*\'(.*?)\';', html)
    if m:
        raw = m.group(1)
        raw_dec = raw.encode().decode('unicode_escape')
        data = json.loads(raw_dec)
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
            return data[0]
    return []

items_asc = fetch_folder_items(folder_id, "a")
items_desc = fetch_folder_items(folder_id, "d")

all_items = {}

for it in items_asc + items_desc:
    if isinstance(it, list) and len(it) >= 3:
        file_id = it[0]
        title = it[2]
        is_folder = (len(it) > 3 and it[3] == 'application/vnd.google-apps.folder')
        all_items[file_id] = {
            "id": file_id,
            "title": title,
            "is_folder": is_folder,
            "mimeType": it[3] if len(it) > 3 else "unknown"
        }

print(f"2. Found {len(all_items)} total items in Google Drive folder.")

for fid, info in sorted(all_items.items(), key=lambda x: x[1]['title']):
    print(f" - [{info['id']}] {info['title']}")

# Save raw crawled data
with open("crawled_user_past_papers.json", "w", encoding="utf-8") as f:
    json.dump(list(all_items.values()), f, indent=2, ensure_ascii=False)
print("\nSaved raw data to crawled_user_past_papers.json")
