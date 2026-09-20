import os
import sys
import re
import json
import codecs
import urllib.request
import urllib.parse
import time

# Force UTF-8 for console output on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def fetch_folder_items(folder_id):
    url = f'https://drive.google.com/drive/folders/{folder_id}'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Failed to fetch {folder_id}: {e}")
        return []

    # Find window['_DRIVE_ivd']
    m = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'", html)
    if not m:
        return []

    raw_str = m.group(1)
    try:
        decoded = codecs.decode(raw_str, 'unicode_escape')
        data = json.loads(decoded)
        
        item_list = []
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
            if len(data[0]) > 0 and isinstance(data[0][0], list):
                item_list = data[0]
            else:
                item_list = data
        else:
            item_list = data

        results = []
        for it in item_list:
            if isinstance(it, list) and len(it) >= 4 and isinstance(it[0], str):
                fid = it[0]
                parent_id = it[1][0] if (len(it) > 1 and isinstance(it[1], list) and it[1]) else folder_id
                name = str(it[2])
                mime = str(it[3])
                is_folder = (mime == 'application/vnd.google-apps.folder')
                results.append({
                    'id': fid,
                    'name': name,
                    'mimeType': mime,
                    'is_folder': is_folder,
                    'parent_id': parent_id
                })
        return results
    except Exception as e:
        print(f"Error parsing JSON for {folder_id}: {e}")
        return []

def recursive_crawl():
    root_id = '1iJNb2Bl15yltfFPjg2xZoL1S4BubWcj6'
    print(f"Starting recursive crawl on Google Drive: {root_id}")
    
    all_files = []
    folders_to_visit = [{'id': root_id, 'name': 'Class 9 Root', 'path': ''}]
    visited_folders = set()
    
    while folders_to_visit:
        current_folder = folders_to_visit.pop(0)
        fid = current_folder['id']
        fname = current_folder['name']
        fpath = current_folder['path']
        
        if fid in visited_folders:
            continue
        visited_folders.add(fid)
        
        print(f"\n[SCANNING] Folder: {fname} (ID: {fid})")
        items = fetch_folder_items(fid)
        print(f"   Found {len(items)} items inside.")
        
        for item in items:
            # Skip temp raw folders
            if item['name'].startswith('_temp'):
                continue
                
            item_path = f"{fpath} / {item['name']}" if fpath else item['name']
            if item['is_folder']:
                print(f"   -> [FOLDER] {item['name']} (ID: {item['id']})")
                folders_to_visit.append({
                    'id': item['id'],
                    'name': item['name'],
                    'path': item_path
                })
            else:
                print(f"   -> [FILE] {item['name']} (ID: {item['id']})")
                all_files.append({
                    'id': item['id'],
                    'name': item['name'],
                    'mimeType': item['mimeType'],
                    'folder_name': fname,
                    'folder_id': fid,
                    'full_path': item_path
                })
        
        time.sleep(0.3)
        
    print(f"\n======================================")
    print(f"TOTAL CLEAN FILES FOUND: {len(all_files)}")
    print(f"TOTAL FOLDERS SCANNED: {len(visited_folders)}")
    
    with open('crawled_drive_files.json', 'w', encoding='utf-8') as f:
        json.dump(all_files, f, indent=2, ensure_ascii=False)
        
    return all_files

if __name__ == '__main__':
    recursive_crawl()
