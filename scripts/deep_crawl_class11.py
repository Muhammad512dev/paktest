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

def fetch_items_from_url(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return []

    m = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'", html)
    if not m:
        return []

    try:
        decoded = codecs.decode(m.group(1), 'unicode_escape')
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
                name = str(it[2])
                mime = str(it[3])
                is_folder = (mime == 'application/vnd.google-apps.folder')
                results.append({
                    'id': fid,
                    'name': name,
                    'mimeType': mime,
                    'is_folder': is_folder
                })
        return results
    except Exception as e:
        return []

def fetch_folder_batchexecute(folder_id):
    # Fetch folder page to get at token
    url = f'https://drive.google.com/drive/folders/{folder_id}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception:
        return []

    m_at = re.search(r'"SNlM0e":"([^"]+)"', html)
    at_token = m_at.group(1) if m_at else ""

    all_items = []
    # Try requesting with large page sizes
    for page_size in [100, 250, 500]:
        payload_inner = [folder_id, None, page_size, None, None, None, None, None, None, None, None]
        rpc_req = [[["aZljm", json.dumps(payload_inner), None, "generic"]]]
        f_req = json.dumps(rpc_req)
        body = urllib.parse.urlencode({'f.req': f_req, 'at': at_token}).encode('utf-8')
        rpc_url = 'https://drive.google.com/_/DriveUi/data/batchexecute?rpcids=aZljm&source-path=%2Fdrive%2Ffolders%2F' + folder_id
        req_post = urllib.request.Request(rpc_url, data=body, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'Referer': f'https://drive.google.com/drive/folders/{folder_id}',
            'Origin': 'https://drive.google.com'
        })
        try:
            with urllib.request.urlopen(req_post, timeout=20) as resp:
                raw_resp = resp.read().decode('utf-8', errors='ignore')
                
                # Extract JSON from batchexecute wrapper
                lines = raw_resp.splitlines()
                for line in lines:
                    if line.startswith('[["wrb.fr"'):
                        batch_data = json.loads(line)
                        inner_json_str = batch_data[0][2]
                        if inner_json_str:
                            inner_data = json.loads(inner_json_str)
                            # inner_data[0] contains the items array
                            if isinstance(inner_data, list) and len(inner_data) > 0 and isinstance(inner_data[0], list):
                                for it in inner_data[0]:
                                    if isinstance(it, list) and len(it) >= 4 and isinstance(it[0], str):
                                        all_items.append({
                                            'id': it[0],
                                            'name': str(it[2]),
                                            'mimeType': str(it[3]),
                                            'is_folder': (str(it[3]) == 'application/vnd.google-apps.folder')
                                        })
                if all_items:
                    break
        except Exception as e:
            pass
    return all_items

def fetch_folder_exhaustive(folder_id):
    urls = [
        f'https://drive.google.com/drive/folders/{folder_id}',
        f'https://drive.google.com/drive/folders/{folder_id}?sort=13&direction=a',
        f'https://drive.google.com/drive/folders/{folder_id}?sort=13&direction=d',
        f'https://drive.google.com/drive/folders/{folder_id}?sort=14&direction=a',
        f'https://drive.google.com/drive/folders/{folder_id}?sort=14&direction=d',
        f'https://drive.google.com/drive/folders/{folder_id}?sort=7&direction=a',
        f'https://drive.google.com/drive/folders/{folder_id}?sort=7&direction=d',
        f'https://drive.google.com/drive/folders/{folder_id}?sort=2&direction=a',
        f'https://drive.google.com/drive/folders/{folder_id}?sort=2&direction=d',
    ]
    
    unique_items = {}
    for u in urls:
        items = fetch_items_from_url(u)
        for it in items:
            unique_items[it['id']] = it
            
    # Also try batchexecute RPC
    rpc_items = fetch_folder_batchexecute(folder_id)
    for it in rpc_items:
        unique_items[it['id']] = it
        
    return list(unique_items.values())

def run_deep_crawl():
    root_id = '1hO2Gn3VLLvAqHuZYHMEiD15pvLgtQukt'
    print(f"=== DEEP EXHAUSTIVE CRAWL ON CLASS 11 DRIVE ({root_id}) ===")
    
    root_items = fetch_folder_exhaustive(root_id)
    print(f"Found {len(root_items)} items in Class 11 root folder.")
    
    folders_to_scan = []
    direct_files = []
    
    for it in root_items:
        if it['is_folder']:
            folders_to_scan.append({'id': it['id'], 'name': it['name'], 'path': it['name']})
        else:
            it['folder_name'] = 'Root'
            it['full_path'] = it['name']
            direct_files.append(it)
            
    visited = set([root_id])
    all_files = list(direct_files)
    
    while folders_to_scan:
        current = folders_to_scan.pop(0)
        fid = current['id']
        fname = current['name']
        fpath = current['path']
        
        if fid in visited:
            continue
        visited.add(fid)
        
        print(f"\nScanning: {fname} (ID: {fid})", flush=True)
        items = fetch_folder_exhaustive(fid)
        files_count = 0
        
        for it in items:
            if it['name'].startswith('_temp'):
                continue
            item_path = f"{fpath} / {it['name']}"
            if it['is_folder']:
                print(f"  -> Nested Folder found: {it['name']} ({it['id']})", flush=True)
                folders_to_scan.append({
                    'id': it['id'],
                    'name': it['name'],
                    'path': item_path
                })
            else:
                files_count += 1
                it['folder_name'] = fname
                it['full_path'] = item_path
                all_files.append(it)
                
        print(f"  ==> Total files extracted from {fname}: {files_count}", flush=True)
        time.sleep(0.2)
        
    # Deduplicate all files by ID
    final_dict = {}
    for f in all_files:
        if not f.get('is_folder', False):
            final_dict[f['id']] = f
            
    print("\n" + "="*60)
    print(f"TOTAL UNIQUE CLASS 11 FILES FOUND: {len(final_dict)}")
    print("="*60)
    
    with open('crawled_class11_drive_files.json', 'w', encoding='utf-8') as f:
        json.dump(list(final_dict.values()), f, indent=2, ensure_ascii=False)
        
    print(f"Saved {len(final_dict)} files to crawled_class11_drive_files.json")

if __name__ == '__main__':
    run_deep_crawl()
