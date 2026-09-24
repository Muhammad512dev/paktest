import requests
import re
import os

fid = '1JCAPEE8Dd4gf87tpvGB1vPXmUOkZ7A0X'
url = f'https://drive.usercontent.google.com/download?id={fid}&export=download&authuser=0'
s = requests.Session()
s.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
})
r = s.get(url, stream=True, timeout=20)
print("Initial status:", r.status_code, flush=True)
chunk = next(r.iter_content(1024), b'')
print("Initial chunk is PDF:", chunk.startswith(b'%PDF'), flush=True)

if not chunk.startswith(b'%PDF'):
    # Check for virus warning form
    html = chunk.decode('utf-8', errors='ignore') + r.text
    forms = re.findall(r'<form[^>]+action="([^"]+)"[^>]*>(.*?)</form>', html, re.DOTALL)
    if forms:
        action, body = forms[0]
        inputs = dict(re.findall(r'<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"', body))
        print("Inputs extracted from form:", inputs, flush=True)
        r2 = s.get(action, params=inputs, stream=True, timeout=20)
        chunk2 = next(r2.iter_content(1024), b'')
        print("Confirmed chunk is PDF:", chunk2.startswith(b'%PDF'), flush=True)
        if chunk2.startswith(b'%PDF'):
            with open('test_chapter.pdf', 'wb') as f:
                f.write(chunk2)
                for chk in r2.iter_content(65536):
                    f.write(chk)
            print("Downloaded file size KB:", os.path.getsize('test_chapter.pdf') / 1024, flush=True)
            os.remove('test_chapter.pdf')
else:
    with open('test_chapter.pdf', 'wb') as f:
        f.write(chunk)
        for chk in r.iter_content(65536):
            f.write(chk)
    print("Downloaded file size KB:", os.path.getsize('test_chapter.pdf') / 1024, flush=True)
    os.remove('test_chapter.pdf')
