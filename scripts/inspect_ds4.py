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

def inspect_ds4(folder_id):
    url = f'https://drive.google.com/drive/folders/{folder_id}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    html = urllib.request.urlopen(req, timeout=25).read().decode('utf-8', errors='ignore')
    
    parts = html.split("key: 'ds:4'")
    if len(parts) < 2:
        print("ds:4 not found")
        return
    
    cb_str = parts[1].split(');</script>')[0]
    m_data = re.search(r'data:\s*(\[.+\])\s*(?:,\s*sideChannel|$)', cb_str, re.DOTALL)
    if m_data:
        try:
            raw = m_data.group(1).rstrip('}')
            data = json.loads(raw)
            print("Successfully parsed ds:4!")
            print(f"Data type: {type(data)}, length: {len(data)}")
            # Let's search recursively for all .pdf strings and all file IDs in data
            def find_strings(obj):
                found = []
                if isinstance(obj, str):
                    if obj.endswith('.pdf'):
                        found.append(obj)
                elif isinstance(obj, list):
                    for item in obj:
                        found.extend(find_strings(item))
                elif isinstance(obj, dict):
                    for v in obj.values():
                        found.extend(find_strings(v))
                return found
            
            pdfs = find_strings(data)
            print(f"Unique PDFs in ds:4: {len(set(pdfs))}")
            
            # Print any long string tokens or potential continuation tokens
            def find_tokens(obj):
                toks = []
                if isinstance(obj, str):
                    if len(obj) > 40 and not obj.endswith('.pdf') and not obj.startswith('http'):
                        toks.append(obj)
                elif isinstance(obj, list):
                    for item in obj:
                        toks.extend(find_tokens(item))
                elif isinstance(obj, dict):
                    for v in obj.values():
                        toks.extend(find_tokens(v))
                return toks
            
            tokens = find_tokens(data)
            print(f"Found {len(tokens)} long tokens:")
            for t in tokens[:10]:
                print(f"  - {t}")
                
        except Exception as e:
            print("Parse error:", e)

if __name__ == '__main__':
    print("=== MATHEMATICS ===")
    inspect_ds4('1-wBvUyINK2UYVorVYsQrNLDHk4QrJlUO')
    print("\n=== BIOLOGY ===")
    inspect_ds4('1E__SsNDKxglNKtCChoRkGnT2B-lvXXAt')
    print("\n=== CHEMISTRY ===")
    inspect_ds4('1qSTMgvlqDkZhXNdxxeXUt5V8_nb5sk69')
