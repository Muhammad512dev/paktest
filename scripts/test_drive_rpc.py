import os
import sys
import re
import json
import urllib.request
import urllib.parse
import codecs

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

def find_page_tokens_and_rpc(folder_id):
    url = f'https://drive.google.com/drive/folders/{folder_id}'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching HTML: {e}")
        return

    # Extract all string literals that look like folder items or tokens
    # In window['_DRIVE_ivd'], let's see what is stored in all indices
    m = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'", html)
    if m:
        raw_str = m.group(1)
        decoded = codecs.decode(raw_str, 'unicode_escape')
        data = json.loads(decoded)
        print(f"data length: {len(data)}")
        for idx, el in enumerate(data):
            if isinstance(el, list):
                print(f"  Index {idx}: list of len {len(el)}")
            elif isinstance(el, str):
                print(f"  Index {idx}: str: {el[:100]}")
            else:
                print(f"  Index {idx}: {type(el)} -> {str(el)[:100]}")

if __name__ == '__main__':
    find_page_tokens_and_rpc('1-wBvUyINK2UYVorVYsQrNLDHk4QrJlUO')
