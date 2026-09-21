import os
import sys
import re
import json
import urllib.request
import urllib.parse

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

def inspect_callbacks(folder_id):
    url = f'https://drive.google.com/drive/folders/{folder_id}'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    })
    html = urllib.request.urlopen(req, timeout=25).read().decode('utf-8', errors='ignore')
    
    parts = html.split('AF_initDataCallback(')
    print(f"Total parts: {len(parts)-1}")
    for idx, p in enumerate(parts[1:], 1):
        cb_str = p.split(');</script>')[0]
        m_key = re.search(r"key:\s*'([^']+)'", cb_str)
        key = m_key.group(1) if m_key else f"unknown_{idx}"
        print(f"\n--- Callback {idx} [Key: {key}] (Length: {len(cb_str)}) ---")
        print(cb_str[:400])

if __name__ == '__main__':
    inspect_callbacks('1-wBvUyINK2UYVorVYsQrNLDHk4QrJlUO')
