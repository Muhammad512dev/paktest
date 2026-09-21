import os
import sys
import re
import json
import codecs
import urllib.request
import urllib.parse
import time

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def get_drive_html(folder_id):
    url = f'https://drive.google.com/drive/folders/{folder_id}'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching {folder_id}: {e}")
        return ""

def parse_ivd(html):
    m = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'", html)
    if not m:
        return [], None
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
        return item_list, data
    except Exception as e:
        print(f"JSON decode error: {e}")
        return [], None

def deep_inspect():
    root_id = '1dLyda8bUfo7a4QzlpgDfzxCK7OucbTNj'
    html = get_drive_html(root_id)
    root_items, _ = parse_ivd(html)
    
    print(f"Root items ({len(root_items)}):")
    total_found = 0
    
    for r_item in root_items:
        rfid = r_item[0]
        rfname = r_item[2]
        rmime = r_item[3]
        
        print(f"\n==================================================")
        print(f"Subject Folder: {rfname} (ID: {rfid})")
        
        sub_html = get_drive_html(rfid)
        sub_items, raw_data = parse_ivd(sub_html)
        
        file_count = 0
        subfolder_count = 0
        subfolders = []
        
        for s_item in sub_items:
            smime = s_item[3]
            sid = s_item[0]
            sname = s_item[2]
            
            if smime == 'application/vnd.google-apps.folder':
                subfolder_count += 1
                subfolders.append((sid, sname))
            else:
                file_count += 1
                
        print(f"   Direct files: {file_count}, Subfolders: {subfolder_count}")
        total_found += file_count
        
        # Check subfolders
        for sfid, sfname in subfolders:
            print(f"   Scanning subfolder: {sfname} (ID: {sfid})")
            sf_html = get_drive_html(sfid)
            sf_items, _ = parse_ivd(sf_html)
            sf_files = [x for x in sf_items if x[3] != 'application/vnd.google-apps.folder']
            print(f"      Files inside {sfname}: {len(sf_files)}")
            total_found += len(sf_files)
            for f in sf_files:
                print(f"         - {f[2]} (ID: {f[0]})")
                
        # Check if there is a pagination token in raw_data
        # Google Drive returns [items, pageToken] or similar
        print(f"   Checking pagination in raw data...")
        if isinstance(raw_data, list) and len(raw_data) > 1:
            print(f"   Raw data elements: {len(raw_data)}")
            for idx, el in enumerate(raw_data):
                if idx > 0 and el:
                    print(f"      Element {idx}: {str(el)[:200]}")
                    
    print(f"\n==================================================")
    print(f"TOTAL FILES FOUND ACROSS ALL FOLDERS: {total_found}")

if __name__ == '__main__':
    deep_inspect()
