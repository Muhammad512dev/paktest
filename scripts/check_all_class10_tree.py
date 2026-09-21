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
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

def get_drive_html(folder_id):
    url = f'https://drive.google.com/drive/folders/{folder_id}'
    print(f"Fetching {folder_id}...", flush=True)
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = resp.read().decode('utf-8', errors='ignore')
            print(f"  -> Got {len(data)} bytes", flush=True)
            return data
    except Exception as e:
        print(f"Error fetching {folder_id}: {e}", flush=True)
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

def check_tree():
    root_id = '1dLyda8bUfo7a4QzlpgDfzxCK7OucbTNj'
    root_html = get_drive_html(root_id)
    root_items, _ = parse_ivd(root_html)
    
    print(f"Total root items: {len(root_items)}")
    
    total_files = 0
    all_files_dict = {}

    for r_item in root_items:
        fid = r_item[0]
        fname = r_item[2]
        fmime = r_item[3]
        
        print(f"\n=======================================================")
        print(f"ROOT FOLDER: {fname} (ID: {fid})")
        
        sub_html = get_drive_html(fid)
        sub_items, _ = parse_ivd(sub_html)
        
        if not sub_items or not isinstance(sub_items, list):
            sub_items = []
        
        direct_files = [x for x in sub_items if isinstance(x, list) and len(x) > 3 and x[3] != 'application/vnd.google-apps.folder']
        sub_folders = [x for x in sub_items if isinstance(x, list) and len(x) > 3 and x[3] == 'application/vnd.google-apps.folder']
        
        print(f"  Direct Files: {len(direct_files)}")
        print(f"  Subfolders: {len(sub_folders)}")
        
        for f in direct_files:
            total_files += 1
            all_files_dict[f[0]] = (fname, f[2])
            
        for sf in sub_folders:
            sf_id = sf[0]
            sf_name = sf[2]
            sf_html = get_drive_html(sf_id)
            sf_items, _ = parse_ivd(sf_html)
            if not sf_items or not isinstance(sf_items, list):
                sf_items = []
            sf_files = [x for x in sf_items if isinstance(x, list) and len(x) > 3 and x[3] != 'application/vnd.google-apps.folder']
            sf_sub = [x for x in sf_items if isinstance(x, list) and len(x) > 3 and x[3] == 'application/vnd.google-apps.folder']
            print(f"    Subfolder: {sf_name} (ID: {sf_id}) -> Files: {len(sf_files)}, Subfolders: {len(sf_sub)}")
            for f in sf_files:
                total_files += 1
                all_files_dict[f[0]] = (f"{fname} > {sf_name}", f[2])
                
            for ssf in sf_sub:
                ssf_id = ssf[0]
                ssf_name = ssf[2]
                ssf_html = get_drive_html(ssf_id)
                ssf_items, _ = parse_ivd(ssf_html)
                if not ssf_items or not isinstance(ssf_items, list):
                    ssf_items = []
                ssf_files = [x for x in ssf_items if isinstance(x, list) and len(x) > 3 and x[3] != 'application/vnd.google-apps.folder']
                print(f"      Sub-Subfolder: {ssf_name} (ID: {ssf_id}) -> Files: {len(ssf_files)}")
                for f in ssf_files:
                    total_files += 1
                    all_files_dict[f[0]] = (f"{fname} > {sf_name} > {ssf_name}", f[2])

    print(f"\n=======================================================")
    print(f"TOTAL UNIQUE FILES FOUND VIA HTML IVD: {len(all_files_dict)}")

if __name__ == '__main__':
    check_tree()
