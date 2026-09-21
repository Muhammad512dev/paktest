import urllib.request
import re
import codecs
import json

def fetch_with_sort(fid, sort_param):
    url = f'https://drive.google.com/drive/folders/{fid}{sort_param}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        html = urllib.request.urlopen(req, timeout=20).read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error: {e}")
        return []
    m = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'", html)
    if not m:
        return []
    raw = codecs.decode(m.group(1), 'unicode_escape')
    data = json.loads(raw)
    items = data[0] if (isinstance(data, list) and len(data)>0 and isinstance(data[0], list) and len(data[0])>0 and isinstance(data[0][0], list)) else data
    return items

if __name__ == '__main__':
    math_fid = '1-wBvUyINK2UYVorVYsQrNLDHk4QrJlUO'
    params = [
        '',
        '?sort=13&direction=d',
        '?sort=14&direction=d',
        '?sort=7&direction=d',
        '?sort=1&direction=d',
        '?sort=name_desc',
        '?sort=name%20desc',
        '?ths=1&sort=13&direction=d',
        '?sort=13&direction=desc',
        '?direction=d'
    ]
    for p in params:
        res = fetch_with_sort(math_fid, p)
        print(f"Param: '{p}' -> {len(res)} items")
        if len(res) > 0:
            print(f"   First: {res[0][2]}, Last: {res[-1][2]}")
