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

def test_rpc(folder_id):
    # Fetch folder page to get at/f.sid tokens
    url = f'https://drive.google.com/drive/folders/{folder_id}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    html = urllib.request.urlopen(req, timeout=25).read().decode('utf-8', errors='ignore')
    
    m_at = re.search(r'"SNlM0e":"([^"]+)"', html)
    at_token = m_at.group(1) if m_at else ""
    print(f"at_token: {at_token}")

    # The payload for aZljm:
    # [folder_id, page_token_or_null, page_size, sort_field, sort_direction]
    # Let's try different payload variations:
    payload_inner = [folder_id, None, 200, None, None, None, None, None, None, None, None]
    rpc_req = [[["aZljm", json.dumps(payload_inner), None, "generic"]]]
    f_req = json.dumps(rpc_req)
    
    body = urllib.parse.urlencode({'f.req': f_req, 'at': at_token}).encode('utf-8')
    
    rpc_url = 'https://drive.google.com/_/DriveUi/data/batchexecute?rpcids=aZljm&source-path=%2Fdrive%2Ffolders%2F' + folder_id
    req_post = urllib.request.Request(rpc_url, data=body, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Referer': f'https://drive.google.com/drive/folders/{folder_id}',
        'Origin': 'https://drive.google.com'
    })
    
    try:
        with urllib.request.urlopen(req_post, timeout=25) as resp:
            raw_resp = resp.read().decode('utf-8', errors='ignore')
            print(f"Response size: {len(raw_resp)}")
            pdfs = re.findall(r'\"([^\"]+?\.pdf)\"', raw_resp)
            print(f"Found {len(set(pdfs))} unique PDFs in response!")
            for p in list(set(pdfs))[:10]:
                print(f"  - {p}")
    except Exception as e:
        print(f"POST error: {e}")

if __name__ == '__main__':
    test_rpc('1-wBvUyINK2UYVorVYsQrNLDHk4QrJlUO')
