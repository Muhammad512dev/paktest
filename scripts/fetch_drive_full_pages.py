import os
import sys
import re
import json
import codecs
import urllib.request
import urllib.parse
import time

def test_drive_api(folder_id):
    # Method 1: Google Drive v2internal API (used by drive.google.com frontend)
    api_url = f"https://clients6.google.com/drive/v2internal/files?folderId={folder_id}&maxResults=100&fields=items(id,title,mimeType),nextPageToken"
    req = urllib.request.Request(api_url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        'X-Goog-AuthUser': '0'
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            items = data.get('items', [])
            print(f"[v2internal API] Folder {folder_id} -> {len(items)} items returned!")
            return items
    except Exception as e:
        print(f"[v2internal API] Error: {e}")

    # Method 2: Drive batchexecute RPC (GetFolderChildren)
    rpc_url = "https://drive.google.com/_/DriveUi/data/batchexecute"
    # rpc format: f.req=[[["aZljm", "[null, \"folder_id\", null, null, 100]", null, "generic"]]]
    payload_data = json.dumps([folder_id, None, 100, None, [4, 1, 1]])
    rpc_payload = f'f.req=[[["aZljm","{payload_data.replace(\'"\', \'\\\\"\')}",null,"generic"]]]'
    
    post_data = urllib.parse.urlencode({'f.req': json.dumps([[['aZljm', payload_data, None, 'generic']]])}).encode('utf-8')
    req2 = urllib.request.Request(rpc_url, data=post_data, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    })
    try:
        with urllib.request.urlopen(req2, timeout=10) as resp:
            res_text = resp.read().decode('utf-8')
            print(f"[batchexecute RPC] Folder {folder_id} -> response len: {len(res_text)}")
            with open('rpc_resp.txt', 'w', encoding='utf-8') as f:
                f.write(res_text)
    except Exception as e:
        print(f"[batchexecute RPC] Error: {e}")

if __name__ == '__main__':
    test_drive_api('1-wBvUyINK2UYVorVYsQrNLDHk4QrJlUO') # Math
