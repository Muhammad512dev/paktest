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

def get_html(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""

def inspect_all_scripts(folder_id):
    html = get_html(f'https://drive.google.com/drive/folders/{folder_id}')
    print(f"HTML size for {folder_id}: {len(html)}")
    
    # 1. Look for all callback data
    callbacks = re.findall(r'AF_initDataCallback\(\{key: \'(.*?)\', hash: \'(.*?)\', data:(.*?)\}\);', html, re.DOTALL)
    print(f"AF_initDataCallbacks found: {len(callbacks)}")
    
    # 2. Look for window['_DRIVE_ivd']
    m = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'", html)
    if m:
        raw_str = m.group(1)
        decoded = codecs.decode(raw_str, 'unicode_escape')
        data = json.loads(decoded)
        print(f"_DRIVE_ivd root length: {len(data)}")
        if isinstance(data, list) and len(data) > 0:
            print(f"Items in list: {len(data[0]) if isinstance(data[0], list) else len(data)}")
            
    # 3. Check for next page token in data
    # In Google Drive client, next page token is a string (e.g. alphanumeric token)
    tokens = re.findall(r'\"([a-zA-Z0-9_\-\.]{80,})\"', html)
    print(f"Potential long tokens found: {len(tokens)}")
    for t in tokens[:3]:
        print(f"  Token: {t[:50]}...")
        
    # 4. Check all .pdf strings in html
    pdfs = set(re.findall(r'\"([^\"]+?\.pdf)\"', html))
    print(f"Unique PDF filenames in HTML: {len(pdfs)}")

if __name__ == '__main__':
    # Inspect Biology
    print("=== BIOLOGY ===")
    inspect_all_scripts('1E__SsNDKxglNKtCChoRkGnT2B-lvXXAt')
    
    # Inspect Chemistry
    print("\n=== CHEMISTRY ===")
    inspect_all_scripts('1qSTMgvlqDkZhXNdxxeXUt5V8_nb5sk69')
    
    # Inspect Tarjuma Tul Quran
    print("\n=== TARJUMA TUL QURAN ===")
    inspect_all_scripts('1xIJJsRp9em54ooadFD5FuzSghODPLyjr')
