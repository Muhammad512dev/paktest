import os
import re
import json
import urllib.request
import urllib.parse

def fetch_drive_data(folder_id):
    url = f'https://drive.google.com/drive/folders/{folder_id}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching folder {folder_id}: {e}")
        return ""

def parse_folder_html(html):
    # Google Drive puts initial data in JSON arrays.
    # Look for patterns like: ["file_id", ["file_name.pdf", ...], "mimeType"]
    # or items array in window['_DRIVE_ivd']
    results = []
    
    # 1. Match item arrays: [["id",["title",...],"mimeType"]]
    matches = re.findall(r'\["([a-zA-Z0-9_-]{28,45})",\["([^"]+)"', html)
    for fid, fname in matches:
        if fid not in [r['id'] for r in results]:
            results.append({'id': fid, 'name': fname})

    # 2. Match drive item structure [["id","name",...]]
    matches2 = re.findall(r'\["([a-zA-Z0-9_-]{28,45})","([^"]+\.[a-zA-Z0-9]{2,5})"', html)
    for fid, fname in matches2:
        if fid not in [r['id'] for r in results]:
            results.append({'id': fid, 'name': fname})

    # 3. Look for all strings ending in .pdf and search near them for ID
    pdf_names = re.findall(r'"([^"]+?\.(?:pdf|docx?|zip|rar))"', html, re.IGNORECASE)
    print(f"Found {len(pdf_names)} PDF/doc filenames")
    
    return results, pdf_names

def crawl_drive():
    root_folder = '1iJNb2Bl15yltfFPjg2xZoL1S4BubWcj6'
    html = fetch_drive_data(root_folder)
    
    with open('drive_root.html', 'w', encoding='utf-8') as f:
        f.write(html)
        
    items, pdf_names = parse_folder_html(html)
    print(f"Parsed items: {len(items)}")
    for it in items[:30]:
        print(f"  - {it['name']} (ID: {it['id']})")
        
    # Check if there are subfolders in html
    # Subfolders usually have mimeType 'application/vnd.google-apps.folder'
    folder_matches = re.findall(r'\["([a-zA-Z0-9_-]{28,45})",\["([^"]+)",[^\]]+application/vnd\.google-apps\.folder', html)
    print(f"Subfolders found: {len(folder_matches)}")
    for fid, fname in folder_matches:
        print(f"  Folder: {fname} (ID: {fid})")

if __name__ == '__main__':
    crawl_drive()
