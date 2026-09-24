import os
import sys
import glob
import re
import json
import pymupdf
import requests
import time
import urllib.parse

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

APP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "universal_notes_downloader")
CATALOG_FILE = os.path.join(APP_DIR, "multi_class_catalog.json")

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
})

def is_valid_pdf_file(path):
    if not os.path.exists(path) or os.path.getsize(path) < 1000:
        return False
    try:
        with open(path, 'rb') as f:
            header = f.read(1024)
            if b'%PDF' not in header:
                return False
        doc = pymupdf.open(path)
        p_cnt = len(doc)
        doc.close()
        return p_cnt > 0
    except Exception:
        return False

def extract_download_sources(page_url):
    try:
        resp = session.get(page_url, timeout=15)
        html = resp.text
        sources = []
        fids = re.findall(r'drive\.google\.com/(?:file/d/|uc\?export=download&amp;id=|uc\?export=download&id=|open\?id=)([a-zA-Z0-9_-]+)', html)
        for fid in fids:
            if fid not in sources:
                sources.append(('drive', fid))
                
        docs_ids = re.findall(r'docs\.google\.com/document/d/([a-zA-Z0-9_-]+)', html)
        for did in docs_ids:
            export_url = f"https://docs.google.com/document/d/{did}/export?format=pdf"
            if export_url not in sources:
                sources.append(('direct_url', export_url))
                
        pdf_links = re.findall(r'href=[\'"]([^\'"]+\.pdf[^\'"]*)[\'"]', html, re.I)
        for plink in pdf_links:
            full_link = urllib.parse.urljoin(page_url, plink)
            if full_link not in sources:
                sources.append(('direct_url', full_link))
                
        iframes = re.findall(r'<iframe[^>]+src=[\'"]([^\'"]+)[\'"]', html, re.I)
        for ifr in iframes:
            if 'drive.google.com' in ifr or 'docs.google.com' in ifr:
                if_fids = re.findall(r'(?:/d/|id=)([a-zA-Z0-9_-]{25,45})', ifr)
                for ifid in if_fids:
                    if ifid not in sources:
                        sources.append(('drive', ifid))
        return sources
    except Exception:
        return []

def download_drive_file(file_id, dest_path):
    endpoints = [
        f"https://drive.usercontent.google.com/download?id={file_id}&export=download&authuser=0",
        f"https://docs.google.com/uc?export=download&id={file_id}"
    ]
    for url in endpoints:
        try:
            resp = session.get(url, stream=True, timeout=30)
            chunk = next(resp.iter_content(2048), b'')
            if chunk.startswith(b'%PDF') or b'%PDF' in chunk[:1024]:
                with open(dest_path, 'wb') as f:
                    f.write(chunk)
                    for chk in resp.iter_content(65536):
                        if chk:
                            f.write(chk)
                if is_valid_pdf_file(dest_path):
                    return True
                    
            html_snippet = chunk.decode('utf-8', errors='ignore') + resp.text[:4000]
            forms = re.findall(r'<form[^>]+action="([^"]+)"[^>]*>(.*?)</form>', html_snippet, re.DOTALL)
            if forms:
                action, body = forms[0]
                inputs = dict(re.findall(r'<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"', body))
                if 'confirm' not in inputs:
                    inputs['confirm'] = 't'
                r_confirm = session.get(action, params=inputs, stream=True, timeout=35)
                c2 = next(r_confirm.iter_content(2048), b'')
                if c2.startswith(b'%PDF') or b'%PDF' in c2[:1024]:
                    with open(dest_path, 'wb') as f:
                        f.write(c2)
                        for chk in r_confirm.iter_content(65536):
                            if chk:
                                f.write(chk)
                    if is_valid_pdf_file(dest_path):
                        return True
            if os.path.exists(dest_path):
                try: os.remove(dest_path)
                except Exception: pass
        except Exception:
            if os.path.exists(dest_path):
                try: os.remove(dest_path)
                except Exception: pass
    return False

def download_direct_pdf(url, dest_path):
    try:
        resp = session.get(url, stream=True, timeout=30)
        chunk = next(resp.iter_content(2048), b'')
        if chunk.startswith(b'%PDF') or b'%PDF' in chunk[:1024]:
            with open(dest_path, 'wb') as f:
                f.write(chunk)
                for chk in resp.iter_content(65536):
                    if chk:
                        f.write(chk)
            if is_valid_pdf_file(dest_path):
                return True
        if os.path.exists(dest_path):
            try: os.remove(dest_path)
            except Exception: pass
        return False
    except Exception:
        if os.path.exists(dest_path):
            try: os.remove(dest_path)
            except Exception: pass
        return False

def sanitize_filename(name):
    clean = re.sub(r'[\\/*?:"<>|]', '', name)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def scan_and_repair_downloads():
    base_dir = os.path.expanduser(r"C:\Users\HP\Downloads\PakParcha_Class_Notes")
    print(f"=== SCANNING AND REPAIRING DOWNLOADED NOTES ===")
    print(f"Directory: {base_dir}", flush=True)
    
    if not os.path.exists(base_dir):
        print("Directory does not exist!")
        return
        
    with open(CATALOG_FILE, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
        
    # Build lookup map: (cls_lower, subj_lower, unit, title_lower) -> item
    catalog_map = {}
    for cls_name, subjs in catalog.items():
        for subj_name, items in subjs.items():
            for it in items:
                u = it.get('unit', 1)
                t = it.get('title', '')
                url = it.get('url', '')
                clean_t = sanitize_filename(t)
                fname = f"Unit_{u:02d}_{clean_t}.pdf".lower()
                key = (cls_name.lower(), subj_name.lower(), fname)
                catalog_map[key] = (cls_name, subj_name, it)
                
    all_pdfs = glob.glob(os.path.join(base_dir, '**', '*.pdf'), recursive=True)
    print(f"Found {len(all_pdfs)} files on disk.", flush=True)
    
    valid_count = 0
    corrupted_files = []
    
    for p in all_pdfs:
        if is_valid_pdf_file(p):
            valid_count += 1
        else:
            corrupted_files.append(p)
            
    print(f"Valid PDFs: {valid_count}", flush=True)
    print(f"Corrupted / Broken PDFs needing repair: {len(corrupted_files)}", flush=True)
    
    if not corrupted_files:
        print("\n🎉 ALL FILES ARE 100% VALID AND PRISTINE! Nothing needs repair.")
        return
        
    print("\nStarting Repair on corrupted files...", flush=True)
    fixed_count = 0
    failed_count = 0
    
    for idx, bad_path in enumerate(corrupted_files, 1):
        rel_path = os.path.relpath(bad_path, base_dir)
        parts = rel_path.split(os.sep)
        
        fname = parts[-1]
        subj = parts[-2] if len(parts) >= 2 else ""
        cls_name = parts[-3] if len(parts) >= 3 else ""
        
        print(f"\n[{idx}/{len(corrupted_files)}] Fixing: {rel_path}...", flush=True)
        
        # Look up in catalog
        key = (cls_name.lower(), subj.lower(), fname.lower())
        item_data = catalog_map.get(key)
        
        if not item_data:
            # Try fuzzy match on fname
            for (c, s, fn), data in catalog_map.items():
                if fn == fname.lower() or fname.lower() in fn:
                    item_data = data
                    break
                    
        if not item_data:
            print(f"  ⚠️ Could not match {fname} in catalog.")
            failed_count += 1
            continue
            
        _, _, item = item_data
        page_url = item.get('url', '')
        sources = extract_download_sources(page_url)
        
        repaired = False
        for src_type, src_val in sources:
            if src_type == 'drive':
                ok = download_drive_file(src_val, bad_path)
            else:
                ok = download_direct_pdf(src_val, bad_path)
            if ok and is_valid_pdf_file(bad_path):
                repaired = True
                break
                
        if repaired:
            doc = pymupdf.open(bad_path)
            p_cnt = len(doc)
            doc.close()
            sz_kb = os.path.getsize(bad_path) / 1024
            print(f"  ✅ REPAIRED! {fname} ({p_cnt} pages, {sz_kb:.1f} KB)", flush=True)
            fixed_count += 1
        else:
            print(f"  ❌ Failed to repair link for: {fname}", flush=True)
            failed_count += 1
            
        time.sleep(0.2)
        
    print("\n" + "="*60)
    print(f"REPAIR SUMMARY:")
    print(f"  Total Audited: {len(all_pdfs)}")
    print(f"  Previously Valid: {valid_count}")
    print(f"  Successfully Repaired: {fixed_count}")
    print(f"  Failed / Inactive Links: {failed_count}")
    print("="*60, flush=True)

if __name__ == '__main__':
    scan_and_repair_downloads()
