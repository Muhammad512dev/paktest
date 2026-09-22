import os
import json
import re
import time
import threading
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
import requests

APP_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(APP_DIR, "web")
CATALOG_FILE = os.path.join(APP_DIR, "multi_class_catalog.json")

# Default output directory
DEFAULT_DOWNLOAD_DIR = os.path.join(os.path.expanduser("~"), "Downloads", "PakParcha_Class_Notes")

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
})

def load_catalog():
    if os.path.exists(CATALOG_FILE):
        try:
            with open(CATALOG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

CATALOG = load_catalog()

# Global download state
state_lock = threading.Lock()
download_state = {
    "is_running": False,
    "should_stop": False,
    "total_files": 0,
    "completed_files": 0,
    "skipped_files": 0,
    "failed_files": 0,
    "current_class": "",
    "current_subject": "",
    "current_file": "",
    "download_dir": DEFAULT_DOWNLOAD_DIR,
    "logs": []
}

def add_log(msg, level="info"):
    timestamp = time.strftime("%H:%M:%S")
    with state_lock:
        download_state["logs"].append({
            "time": timestamp,
            "message": msg,
            "level": level
        })
        if len(download_state["logs"]) > 400:
            download_state["logs"] = download_state["logs"][-400:]
    print(f"[{timestamp}] [{level.upper()}] {msg}", flush=True)

def extract_download_sources(page_url):
    """
    Deep extractor that retrieves Google Drive IDs, Google Docs exports,
    or direct PDF download URLs from any educational note page.
    """
    try:
        resp = session.get(page_url, timeout=15)
        html = resp.text
        
        sources = []
        
        # 1. Look for Google Drive file IDs
        fids = re.findall(r'drive\.google\.com/(?:file/d/|uc\?export=download&amp;id=|uc\?export=download&id=|open\?id=)([a-zA-Z0-9_-]+)', html)
        if not fids:
            fids = re.findall(r'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)', html)
        for fid in fids:
            if fid not in sources:
                sources.append(('drive', fid))
                
        # 2. Look for Google Docs Document ID
        docs_ids = re.findall(r'docs\.google\.com/document/d/([a-zA-Z0-9_-]+)', html)
        for did in docs_ids:
            export_url = f"https://docs.google.com/document/d/{did}/export?format=pdf"
            if export_url not in sources:
                sources.append(('direct_url', export_url))
                
        # 3. Look for direct PDF links in hrefs
        pdf_links = re.findall(r'href=[\'"]([^\'"]+\.pdf[^\'"]*)[\'"]', html, re.I)
        for plink in pdf_links:
            full_link = urllib.parse.urljoin(page_url, plink)
            if full_link not in sources:
                sources.append(('direct_url', full_link))
                
        # 4. Check for nested download iframe
        iframes = re.findall(r'<iframe[^>]+src=[\'"]([^\'"]+)[\'"]', html, re.I)
        for ifr in iframes:
            if 'drive.google.com' in ifr or 'docs.google.com' in ifr:
                if_fids = re.findall(r'(?:/d/|id=)([a-zA-Z0-9_-]{25,45})', ifr)
                for ifid in if_fids:
                    if ifid not in sources:
                        sources.append(('drive', ifid))
                        
        return sources
    except Exception as e:
        return []

def download_drive_file(file_id, dest_path):
    """Downloads Google Drive file with modern usercontent endpoint, automatic form handling for large files, and strict PDF validation."""
    endpoints = [
        f"https://drive.usercontent.google.com/download?id={file_id}&export=download&authuser=0",
        f"https://docs.google.com/uc?export=download&id={file_id}"
    ]
    
    for url in endpoints:
        try:
            resp = session.get(url, stream=True, timeout=30)
            chunk = next(resp.iter_content(2048), b'')
            
            # 1. Direct PDF stream
            if chunk.startswith(b'%PDF') or b'%PDF' in chunk[:1024]:
                with open(dest_path, 'wb') as f:
                    f.write(chunk)
                    for chk in resp.iter_content(65536):
                        if chk:
                            f.write(chk)
                if is_valid_pdf_file(dest_path):
                    return True
                    
            # 2. Virus scan warning HTML page with download form
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
                        
            # Clean up failed artifact
            if os.path.exists(dest_path):
                try: os.remove(dest_path)
                except Exception: pass
        except Exception:
            if os.path.exists(dest_path):
                try: os.remove(dest_path)
                except Exception: pass
    return False

def download_direct_pdf(url, dest_path):
    """Downloads direct PDF URL with strict binary validation."""
    try:
        resp = session.get(url, stream=True, timeout=30)
        chunk = next(resp.iter_content(2048), b'')
        if b'%PDF' in chunk or (chunk.startswith(b'%PDF-')):
            with open(dest_path, 'wb') as f:
                f.write(chunk)
                for chk in resp.iter_content(65536):
                    if chk:
                        f.write(chk)
                        
            if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
                with open(dest_path, 'rb') as f_chk:
                    header = f_chk.read(1024)
                    if b'%PDF' in header:
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

def is_valid_pdf_file(path):
    if not os.path.exists(path) or os.path.getsize(path) < 1000:
        return False
    try:
        with open(path, 'rb') as f:
            header = f.read(1024)
            return b'%PDF' in header
    except Exception:
        return False

def sanitize_filename(name):
    clean = re.sub(r'[\\/*?:"<>|]', '', name)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def run_download_worker(selected_classes, selected_subjects, dest_dir):
    catalog = load_catalog()
    with state_lock:
        download_state["is_running"] = True
        download_state["should_stop"] = False
        download_state["completed_files"] = 0
        download_state["skipped_files"] = 0
        download_state["failed_files"] = 0
        download_state["download_dir"] = dest_dir
        download_state["logs"] = []
        
    add_log(f"Starting prioritized download to: {dest_dir}", "info")
    os.makedirs(dest_dir, exist_ok=True)
    
    queue = []
    for cls in selected_classes:
        if cls in catalog:
            for subj in selected_subjects:
                if subj in catalog[cls]:
                    items = catalog[cls][subj]
                    for item in items:
                        queue.append((cls, subj, item))
                        
    with state_lock:
        download_state["total_files"] = len(queue)
        
    add_log(f"Queue prepared: {len(queue)} notes across {len(selected_classes)} class(es).", "info")
    
    for idx, (cls, subj, item) in enumerate(queue, 1):
        with state_lock:
            if download_state["should_stop"]:
                add_log("Download stopped by user.", "warning")
                break
            download_state["current_class"] = cls
            download_state["current_subject"] = subj
            
        unit_num = item.get("unit", 1)
        raw_title = item.get("title", f"Item {idx}")
        clean_title = sanitize_filename(raw_title)
        filename = f"Unit_{unit_num:02d}_{clean_title}.pdf"
        
        with state_lock:
            download_state["current_file"] = f"[{cls}] {subj} -> {filename}"
            
        subj_dir = os.path.join(dest_dir, cls, subj)
        os.makedirs(subj_dir, exist_ok=True)
        dest_path = os.path.join(subj_dir, filename)
        
        # Skip if already exists and is a genuine valid PDF
        if is_valid_pdf_file(dest_path):
            with state_lock:
                download_state["completed_files"] += 1
                download_state["skipped_files"] += 1
            add_log(f"[Skipped - Exists] {cls} > {subj} > {filename}", "skipped")
            continue
            
        page_url = item.get("url", "")
        sources = extract_download_sources(page_url)
        
        downloaded = False
        if sources:
            for src_type, src_val in sources:
                with state_lock:
                    if download_state["should_stop"]:
                        break
                if src_type == 'drive':
                    ok = download_drive_file(src_val, dest_path)
                else:
                    ok = download_direct_pdf(src_val, dest_path)
                    
                if ok:
                    downloaded = True
                    break
                    
        if downloaded:
            with state_lock:
                download_state["completed_files"] += 1
            size_kb = os.path.getsize(dest_path) / 1024
            add_log(f"[Downloaded] {cls} > {subj} > {filename} ({size_kb:.1f} KB)", "success")
        else:
            if os.path.exists(dest_path):
                try:
                    os.remove(dest_path)
                except Exception:
                    pass
            with state_lock:
                download_state["failed_files"] += 1
            add_log(f"[Failed / Link Dead] {cls} > {subj} > {filename}", "error")
            
        time.sleep(0.25)
        
    with state_lock:
        download_state["is_running"] = False
        download_state["current_file"] = "Completed"
        add_log(f"Done! Downloaded: {download_state['completed_files']} (Skipped: {download_state['skipped_files']}), Failed: {download_state['failed_files']}", "info")

class RequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/catalog":
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            cat = load_catalog()
            summary = {}
            for c_name, subjs in cat.items():
                summary[c_name] = {}
                for s_name, items in subjs.items():
                    summary[c_name][s_name] = len(items)
                    
            self.wfile.write(json.dumps({
                "classes": summary,
                "default_path": DEFAULT_DOWNLOAD_DIR
            }).encode('utf-8'))
            return
            
        elif parsed.path == "/api/status":
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            with state_lock:
                self.wfile.write(json.dumps(download_state).encode('utf-8'))
            return
            
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        if parsed.path == "/api/download":
            try:
                body = json.loads(post_data)
                selected_classes = body.get('classes', [])
                selected_subjects = body.get('subjects', [])
                dest_dir = body.get('destination', DEFAULT_DOWNLOAD_DIR).strip() or DEFAULT_DOWNLOAD_DIR
                
                with state_lock:
                    if download_state["is_running"]:
                        self.send_response(400)
                        self.end_headers()
                        self.wfile.write(b'{"error": "Download already running"}')
                        return
                        
                t = threading.Thread(target=run_download_worker, args=(selected_classes, selected_subjects, dest_dir), daemon=True)
                t.start()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "started"}')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return
            
        elif parsed.path == "/api/stop":
            with state_lock:
                download_state["should_stop"] = True
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "stopping"}')
            return
            
        elif parsed.path == "/api/open-folder":
            try:
                body = json.loads(post_data)
                f_path = body.get('path', DEFAULT_DOWNLOAD_DIR)
                os.makedirs(f_path, exist_ok=True)
                os.startfile(f_path)
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"status": "opened"}')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return
            
        self.send_response(404)
        self.end_headers()

def main():
    port = 5055
    server = HTTPServer(('127.0.0.1', port), RequestHandler)
    print(f"Universal Notes Hub Server running at http://127.0.0.1:{port}", flush=True)
    server.serve_forever()

if __name__ == "__main__":
    main()
