import urllib.request
import re
import json
import codecs

url = 'https://drive.google.com/drive/folders/1dLyda8bUfo7a4QzlpgDfzxCK7OucbTNj'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
m = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'", html)
raw = codecs.decode(m.group(1), 'unicode_escape')
data = json.loads(raw)
items = data[0] if (isinstance(data, list) and len(data)>0 and isinstance(data[0], list) and len(data[0])>0 and isinstance(data[0][0], list)) else data

print(f'Root items total: {len(items)}')
for it in items:
    print(f'  - [{it[3]}] {it[2]} (ID: {it[0]})')
