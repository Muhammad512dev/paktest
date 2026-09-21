import urllib.request
import urllib.parse
import re
import json
import ssl
import sys
import time

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

root_folder_id = "1hO2Gn3VLLvAqHuZYHMEiD15pvLgtQukt"
print(f"1. Scanning Class 11 Google Drive folder: {root_folder_id}")

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
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            
        m = re.search(r'window\[\'_DRIVE_ivd\'\]\s*=\s*\'(.*?)\';', html)
        if m:
            raw = m.group(1)
            raw_dec = raw.encode().decode('unicode_escape')
            data = json.loads(raw_dec)
            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                return data[0]
    except Exception as e:
        print(f"Error fetching folder {f_id}: {e}")
    return []

# Fetch root folder items
root_items_asc = fetch_folder_items(root_folder_id, "a")
root_items_desc = fetch_folder_items(root_folder_id, "d")

all_root_items = {}
for it in root_items_asc + root_items_desc:
    if isinstance(it, list) and len(it) >= 3:
        file_id = it[0]
        title = it[2]
        is_folder = (len(it) > 3 and it[3] == 'application/vnd.google-apps.folder')
        all_root_items[file_id] = {
            "id": file_id,
            "title": title,
            "is_folder": is_folder,
            "mimeType": it[3] if len(it) > 3 else "unknown"
        }

print(f"2. Found {len(all_root_items)} items in Root Folder.")

subfolders = [it for it in all_root_items.values() if it["is_folder"]]
root_files = [it for it in all_root_items.values() if not it["is_folder"]]

print(f"   - Subfolders: {len(subfolders)}")
print(f"   - Files in root: {len(root_files)}")

for sf in subfolders:
    print(f"   📁 Subfolder: {sf['title']} ({sf['id']})")

all_files = []
for rf in root_files:
    rf["folder"] = "Root"
    all_files.append(rf)

# Recursively crawl subfolders
for idx, sf in enumerate(subfolders, 1):
    sf_id = sf["id"]
    sf_name = sf["title"]
    print(f"\n[{idx}/{len(subfolders)}] Crawling subfolder: {sf_name} ({sf_id})...")
    
    sf_items_asc = fetch_folder_items(sf_id, "a")
    sf_items_desc = fetch_folder_items(sf_id, "d")
    
    sf_items = {}
    for it in sf_items_asc + sf_items_desc:
        if isinstance(it, list) and len(it) >= 3:
            fid = it[0]
            t = it[2]
            is_f = (len(it) > 3 and it[3] == 'application/vnd.google-apps.folder')
            sf_items[fid] = {
                "id": fid,
                "title": t,
                "is_folder": is_f,
                "folder": sf_name,
                "mimeType": it[3] if len(it) > 3 else "unknown"
            }
            
    # Check if there are sub-subfolders
    for item in sf_items.values():
        if item["is_folder"]:
            print(f"      Nested folder: {item['title']} ({item['id']})")
            nested_asc = fetch_folder_items(item["id"], "a")
            nested_desc = fetch_folder_items(item["id"], "d")
            for nit in nested_asc + nested_desc:
                if isinstance(nit, list) and len(nit) >= 3:
                    all_files.append({
                        "id": nit[0],
                        "title": nit[2],
                        "is_folder": False,
                        "folder": f"{sf_name} > {item['title']}",
                        "mimeType": nit[3] if len(nit) > 3 else "unknown"
                    })
        else:
            all_files.append(item)
            
    print(f"    -> Extracted {len(sf_items)} items from {sf_name}")
    time.sleep(0.3)

# Deduplicate all files by file ID
unique_files = {}
for f in all_files:
    if not f.get("is_folder", False):
        unique_files[f["id"]] = f

print("\n" + "="*60)
print(f"CRAWL COMPLETE: Found {len(unique_files)} unique Class 11 files across all folders!")
print("="*60)

with open("crawled_class11_drive_files.json", "w", encoding="utf-8") as f:
    json.dump(list(unique_files.values()), f, indent=2, ensure_ascii=False)
print("Saved crawled data to crawled_class11_drive_files.json")
