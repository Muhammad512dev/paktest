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

def test_folder(fid, name):
    html = get_html(f'https://drive.google.com/drive/folders/{fid}')
    m = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'", html)
    if not m:
        print(f"No _DRIVE_ivd found in {name}")
        return
    raw_str = m.group(1)
    decoded = codecs.decode(raw_str, 'unicode_escape')
    data = json.loads(decoded)
    
    print(f"\n======================================")
    print(f"Folder: {name} ({fid})")
    print(f"Data root type: {type(data)}, length: {len(data)}")
    for i, el in enumerate(data):
        print(f"  Element {i}: type={type(el)}, len={len(el) if isinstance(el, (list, dict, str)) else 'N/A'}")
        if i == 0 and isinstance(el, list):
            print(f"    First item: {el[0][2] if len(el)>0 and len(el[0])>2 else 'N/A'}")
            print(f"    Last item: {el[-1][2] if len(el)>0 and len(el[-1])>2 else 'N/A'}")
        elif i > 0 and el:
            print(f"    Content: {str(el)[:200]}")

if __name__ == '__main__':
    test_folder('1E__SsNDKxglNKtCChoRkGnT2B-lvXXAt', 'Biology')
    test_folder('1qSTMgvlqDkZhXNdxxeXUt5V8_nb5sk69', 'Chemistry')
    test_folder('1-wBvUyINK2UYVorVYsQrNLDHk4QrJlUO', 'Mathematics')
    test_folder('1xIJJsRp9em54ooadFD5FuzSghODPLyjr', 'Tarjuma Tul Quran')
