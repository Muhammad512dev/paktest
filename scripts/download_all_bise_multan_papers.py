import urllib.request
import urllib.parse
import re
import os
import sys
import ssl
import time

# Ensure UTF-8 output on Windows console
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

url = "https://web.bisemultan.edu.pk/question-papers-with-key-ssc-part-i-9th-1st-annual-2026-examination/"
print(f"1. Fetching page: {url}")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    url,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
)

with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# Destination folder
user_home = os.path.expanduser("~")
download_dir = os.path.join(user_home, "Downloads", "BISE_Multan_9th_2026_Past_Papers")
os.makedirs(download_dir, exist_ok=True)
print(f"2. Target Download Directory: {download_dir}")

# Extract table links
table_matches = re.findall(r'<table[^>]*>(.*?)</table>', html, re.DOTALL | re.IGNORECASE)
papers = []

for table_html in table_matches:
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', table_html, re.DOTALL | re.IGNORECASE)
    for row_html in rows:
        link_matches = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', row_html, re.DOTALL | re.IGNORECASE)
        for href, link_text in link_matches:
            subject_name = re.sub(r'<[^>]+>', ' ', link_text).strip()
            subject_name = re.sub(r'\s+', ' ', subject_name).strip()
            if not subject_name or not href:
                continue
            
            # Extract Google Drive file ID
            file_id_match = re.search(r'/d/([a-zA-Z0-9_-]+)', href)
            file_id = file_id_match.group(1) if file_id_match else None
            
            papers.append({
                "subject": subject_name,
                "url": href,
                "file_id": file_id
            })

print(f"3. Found {len(papers)} past paper subjects to download.\n")

def download_drive_file(file_id, dest_path):
    # Direct Google Drive download endpoint
    direct_url = f"https://drive.google.com/uc?export=download&id={file_id}"
    req = urllib.request.Request(
        direct_url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    )
    
    with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
        content = resp.read()
        
        # Check if Google Drive returned a confirmation token for large files
        if b'confirm=' in content or b'download_warning' in content or b'Google Drive - Virus scan warning' in content:
            text = content.decode('utf-8', errors='ignore')
            confirm_token = None
            token_match = re.search(r'confirm=([a-zA-Z0-9_-]+)', text)
            if token_match:
                confirm_token = token_match.group(1)
            else:
                uuid_match = re.search(r'name="uuid"\s+value="([^"]+)"', text)
                if uuid_match:
                    confirm_token = uuid_match.group(1)
            
            if confirm_token:
                confirm_url = f"https://drive.google.com/uc?export=download&confirm={confirm_token}&id={file_id}"
                req2 = urllib.request.Request(
                    confirm_url,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    }
                )
                with urllib.request.urlopen(req2, context=ctx, timeout=60) as resp2:
                    content = resp2.read()

        with open(dest_path, "wb") as f:
            f.write(content)
            
    return os.path.getsize(dest_path)

# Download loop
success_count = 0
failed_count = 0

for i, p in enumerate(papers, 1):
    subject = p['subject']
    file_id = p['file_id']
    clean_filename = re.sub(r'[\\/*?:"<>|]', '_', subject)
    filename = f"{clean_filename} - 9th 1st Annual 2026 Past Paper.pdf"
    dest_path = os.path.join(download_dir, filename)
    
    print(f"[{i:02d}/{len(papers):02d}] Downloading: {subject}...")
    
    if not file_id:
        print(f"    [SKIP] No Drive file ID found ({p['url']})")
        failed_count += 1
        continue

    try:
        size = download_drive_file(file_id, dest_path)
        with open(dest_path, "rb") as f:
            header = f.read(5)
            is_pdf = header.startswith(b'%PDF')
            
        if is_pdf and size > 1000:
            print(f"    [OK] Saved ({size / (1024*1024):.2f} MB): {filename}")
            success_count += 1
        else:
            print(f"    [WARN] Size: {size} bytes, Header: {header}. Trying fallback...")
            alt_url = f"https://docs.google.com/uc?export=download&id={file_id}"
            req_alt = urllib.request.Request(alt_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req_alt, context=ctx, timeout=60) as resp_alt:
                alt_content = resp_alt.read()
                with open(dest_path, "wb") as f:
                    f.write(alt_content)
            size2 = os.path.getsize(dest_path)
            print(f"    [OK] Alt Saved ({size2 / (1024*1024):.2f} MB): {filename}")
            success_count += 1
    except Exception as e:
        print(f"    [FAIL] Error downloading {subject}: {e}")
        failed_count += 1
        
    time.sleep(0.3)

print("\n" + "="*60)
print(f"COMPLETE: Downloaded {success_count}/{len(papers)} past paper PDFs!")
print(f"Destination: {download_dir}")
print("="*60)
