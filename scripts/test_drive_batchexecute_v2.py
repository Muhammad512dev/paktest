import os
import sys
import re
import json
import urllib.request
import urllib.parse
import http.cookiejar

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

def fetch_with_cookies(folder_id):
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    
    # 1. GET initial folder page
    url = f'https://drive.google.com/drive/folders/{folder_id}'
    req1 = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
    })
    
    resp1 = opener.open(req1, timeout=25)
    html = resp1.read().decode('utf-8', errors='ignore')
    
    print(f"Loaded page for {folder_id}, cookies: {len(cj)}")
    for cookie in cj:
        print(f"  Cookie: {cookie.name} = {cookie.value[:30]}...")

    # Extract SNlM0e (at token) and FdrFJe (session token) and f.sid
    m_at = re.search(r'"SNlM0e":"([^"]+)"', html)
    at_token = m_at.group(1) if m_at else ""
    
    m_fsid = re.search(r'"FdrFJe":"([^"]+)"', html)
    fsid_token = m_fsid.group(1) if m_fsid else ""
    
    print(f"at_token: {at_token[:30] if at_token else 'None'}")
    print(f"fsid_token: {fsid_token[:30] if fsid_token else 'None'}")

    # Extract the aZljm signature from ds:4
    # Callback 5 has: [2, "driveweb;aZljm;11;...", null, ...]
    m_ds4 = re.search(r'driveweb;aZljm;(\d+);' + re.escape(folder_id), html)
    if m_ds4:
        print(f"Found aZljm signature: {m_ds4.group(0)}")
        
    # Check all scripts and hidden json payloads
    scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
    print(f"Total script tags: {len(scripts)}")
    
    all_pdfs = set(re.findall(r'\"([^\"]+?\.pdf)\"', html))
    print(f"PDFs found directly in HTML: {len(all_pdfs)}")

if __name__ == '__main__':
    fetch_with_cookies('1-wBvUyINK2UYVorVYsQrNLDHk4QrJlUO')
