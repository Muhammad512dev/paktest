import urllib.request
import urllib.parse
import re
import os
import io
import time
import socket
import ssl
import numpy as np
from PIL import Image
import pymupdf

socket.setdefaulttimeout(30)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
}

def natural_sort_key(s):
    """Sorts alphanumeric strings naturally (e.g. 1, 2, 10 instead of 1, 10, 2)."""
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', str(s))]


def clean_page_array(arr, remove_header_footer=True, remove_watermark=True):
    """
    Whitens third-party website headers and footers, and removes center watermarks.
    Preserves text and mathematical notation.
    """
    arr = arr.copy()
    H, W, _ = arr.shape
    
    # 1. Whiten header & footer (top & bottom ~4.5%)
    if remove_header_footer:
        top_limit = int(H * 0.045)
        bot_limit = int(H * 0.955)
        arr[0:top_limit, :] = [255, 255, 255]
        arr[bot_limit:H, :] = [255, 255, 255]
    
    # 2. Watermark removal
    if remove_watermark:
        r = arr[:, :, 0].astype(np.float32)
        g = arr[:, :, 1].astype(np.float32)
        b = arr[:, :, 2].astype(np.float32)
        brightness = (r + g + b) / 3.0
        
        watermark_mask = (
            (((g - r > 4) | (g - b > 4)) & (brightness > 115)) |
            (((np.abs(r - g) > 5) | (np.abs(g - b) > 5) | (np.abs(r - b) > 5)) & (brightness > 140)) |
            (brightness > 240)
        )
        arr[watermark_mask] = [255, 255, 255]
        
        # Center watermark zone faint outline cleanup
        wm_y1, wm_y2 = int(H * 0.35), int(H * 0.65)
        wm_x1, wm_x2 = int(W * 0.18), int(W * 0.85)
        
        wm_zone = arr[wm_y1:wm_y2, wm_x1:wm_x2]
        wm_r = wm_zone[:, :, 0].astype(np.float32)
        wm_g = wm_zone[:, :, 1].astype(np.float32)
        wm_b = wm_zone[:, :, 2].astype(np.float32)
        wm_bright = (wm_r + wm_g + wm_b) / 3.0
        
        wm_zone[wm_bright > 175] = [255, 255, 255]
        arr[wm_y1:wm_y2, wm_x1:wm_x2] = wm_zone
    
    return arr


def fetch_url_html(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=25, context=SSL_CTX) as resp:
        return resp.read().decode('utf-8', errors='ignore')


def extract_subject_info(url, html):
    m_title = re.search(r'<title>(.*?)</title>', html, re.I)
    if m_title:
        raw_t = m_title.group(1).split('|')[0].split('- Freeilm')[0].split('- Taleem')[0].strip()
        clean_t = re.sub(r'[,()]+', ' ', raw_t)
        clean_t = ' '.join(clean_t.split())
        if clean_t:
            return clean_t
    
    slug = url.strip('/').split('/')[-1].replace('-', ' ').title()
    return slug or "Downloaded_Notes"


def extract_drive_id_from_text_or_url(text):
    """Extracts a Google Drive file ID from a URL, iframe snippet, or text."""
    if not text:
        return None
    
    # Direct file ID check if 25-45 char alphanumeric
    if re.match(r'^[a-zA-Z0-9_-]{25,45}$', text.strip()):
        return text.strip()
        
    m = re.search(r'drive\.google\.com/(?:file/d/|uc\?export=download&amp;id=|uc\?export=download&id=|open\?id=)([a-zA-Z0-9_-]+)', text)
    if m:
        return m.group(1)
    
    m2 = re.search(r'docs\.google\.com/[^/]+/d/([a-zA-Z0-9_-]+)', text)
    if m2:
        return m2.group(1)
        
    return None


def extract_drive_id_from_page(page_url):
    try:
        html = fetch_url_html(page_url)
        fid = extract_drive_id_from_text_or_url(html)
        if fid:
            return fid
    except:
        pass
    return None


def download_google_drive_file(file_id, dest_path, log_cb=None):
    download_url = f"https://drive.usercontent.google.com/download?id={file_id}&export=download&authuser=0"
    try:
        req = urllib.request.Request(download_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=35, context=SSL_CTX) as resp:
            data = resp.read()
            if data[:4] == b'%PDF' or b'%PDF' in data[:1024]:
                with open(dest_path, 'wb') as f:
                    f.write(data)
                return True
            else:
                token_match = re.search(r'confirm=([0-9A-Za-z_]+)', data.decode('utf-8', errors='ignore'))
                if token_match:
                    t = token_match.group(1)
                    confirm_url = f"https://drive.usercontent.google.com/download?id={file_id}&export=download&confirm={t}"
                    req2 = urllib.request.Request(confirm_url, headers=HEADERS)
                    with urllib.request.urlopen(req2, timeout=35, context=SSL_CTX) as resp2:
                        data2 = resp2.read()
                        if data2[:4] == b'%PDF' or b'%PDF' in data2[:1024]:
                            with open(dest_path, 'wb') as f:
                                f.write(data2)
                            return True
                return False
    except Exception as e:
        if log_cb: log_cb(f"Drive download error ({file_id}): {e}")
        return False


def download_direct_url(url, dest_path, log_cb=None):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=35, context=SSL_CTX) as resp:
            data = resp.read()
            if len(data) > 0:
                with open(dest_path, 'wb') as f:
                    f.write(data)
                return True
    except Exception as e:
        if log_cb: log_cb(f"Direct download error ({url}): {e}")
        return False
    return False


def download_file_smart(source, dest_path, log_cb=None):
    """
    Intelligently downloads either a Google Drive ID / URL, or a direct HTTP/HTTPS link.
    """
    drive_id = extract_drive_id_from_text_or_url(source)
    if drive_id:
        return download_google_drive_file(drive_id, dest_path, log_cb=log_cb)
    elif source.startswith("http://") or source.startswith("https://"):
        return download_direct_url(source, dest_path, log_cb=log_cb)
    return False


def scrape_all_download_items(main_url, log_cb=None):
    """
    Universal website scraper that extracts all note sections, exercises, and PDF links.
    Handles FreeILM, TaleemCity, direct PDF links, and general web pages.
    """
    main_url = main_url.strip()
    
    # Check if single direct PDF link or Drive link
    if main_url.lower().endswith('.pdf'):
        file_name = main_url.split('/')[-1].split('?')[0]
        return "Direct Download", [{
            'unit': 1,
            'title': file_name.replace('.pdf', ''),
            'raw_text': file_name,
            'url': main_url,
            'direct_pdf': True,
            'drive_id': None,
            'sort_key': (1, 0.0)
        }]
    
    drive_id = extract_drive_id_from_text_or_url(main_url)
    if drive_id and ('drive.google.com' in main_url or 'docs.google.com' in main_url):
        return "Google Drive Notes", [{
            'unit': 1,
            'title': "Google Drive PDF",
            'raw_text': "Google Drive PDF",
            'url': main_url,
            'direct_pdf': False,
            'drive_id': drive_id,
            'sort_key': (1, 0.0)
        }]

    if log_cb: log_cb(f"Connecting to: {main_url}")
    main_html = fetch_url_html(main_url)
    subject_title = extract_subject_info(main_url, main_html)
    if log_cb: log_cb(f"Detected Subject: {subject_title}")

    links = re.findall(r'<a\s+[^>]*href=["\'](https?://[^"\']+)["\'][^>]*>(.*?)</a>', main_html, re.DOTALL | re.IGNORECASE)
    
    discovered_tasks = []
    seen_urls = set()
    has_new_syllabus_on_page = 'new-syllabus' in main_html.lower()

    for href, raw_text in links:
        clean_text = re.sub(r'<[^>]+>', '', raw_text).strip()
        clean_text = clean_text.replace('&#8217;', "'").replace('&ndash;', '-').replace('&amp;', '&')
        
        # Check direct PDF link on page
        if href.lower().endswith('.pdf') or '.pdf?' in href.lower():
            if href not in seen_urls:
                seen_urls.add(href)
                m = re.search(r'(?:unit|chapter|ch|ex)[-_ ]*(\d+)', href + " " + clean_text, re.I)
                unit_n = int(m.group(1)) if m else len(discovered_tasks) + 1
                item_t = clean_text or href.split('/')[-1].split('?')[0].replace('.pdf', '')
                discovered_tasks.append({
                    'unit': unit_n,
                    'title': item_t,
                    'raw_text': clean_text,
                    'url': href,
                    'direct_pdf': True,
                    'drive_id': None,
                    'sort_key': (unit_n, natural_sort_key(item_t))
                })
            continue

        # Check unit/chapter links (e.g. FreeILM, TaleemCity, IlmKiDunya)
        m = re.search(r'(?:unit|chapter|exercise)[-_](\d+)', href, re.I)
        if not m:
            m = re.search(r'(?:unit|chapter)\s*(\d+)', clean_text, re.I)
            
        if m:
            is_new = 'new-syllabus' in href.lower() or 'new' in clean_text.lower()
            
            # If the site has New Syllabus, focus on New Syllabus items
            if has_new_syllabus_on_page and not is_new and 'class-9-maths-notes-' in href:
                continue
                
            # Skip hub pages if individual exercises are already listed
            if re.search(r'chapter-\d+-.*solution-pdf', href, re.I) and not re.search(r'exercise|mcqs|definitions', href, re.I):
                continue
                
            if href not in seen_urls:
                seen_urls.add(href)
                unit_num = int(m.group(1))
                
                ex_match = re.search(r'exercise[-_](\d+[-_]\d+|\d+)', href, re.I)
                rev_match = re.search(r'review[-_]exercise', href, re.I)
                
                if rev_match:
                    item_type = f"Review Exercise {unit_num}"
                    sort_k = (unit_num, 999.0)
                elif ex_match:
                    ex_label = ex_match.group(1).replace('_', '.')
                    item_type = f"Exercise {ex_label}"
                    try:
                        sort_k = (unit_num, float(ex_label.replace('-', '.')))
                    except:
                        sort_k = (unit_num, natural_sort_key(ex_label))
                elif 'mcqs' in href.lower() or 'mcq' in clean_text.lower():
                    item_type = f"MCQs Unit {unit_num}"
                    sort_k = (unit_num, 998.0)
                elif 'definitions' in href.lower() or 'overview' in clean_text.lower():
                    item_type = f"Overview Unit {unit_num}"
                    sort_k = (unit_num, 0.0)
                else:
                    item_type = clean_text or f"Chapter {unit_num}"
                    sort_k = (unit_num, 0.0)
                    
                discovered_tasks.append({
                    'unit': unit_num,
                    'title': item_type,
                    'raw_text': clean_text,
                    'url': href,
                    'direct_pdf': False,
                    'drive_id': None,
                    'sort_key': sort_k
                })

    discovered_tasks.sort(key=lambda x: x['sort_key'])
    if log_cb: log_cb(f"Found {len(discovered_tasks)} downloadable sections.")
def is_blackout_or_dummy_page(page):
    """Detects if a page is a dummy solid grey/black screen inserted by software like ZXT2007."""
    text = page.get_text().strip()
    if len(text) > 25:
        return False
    try:
        pix = page.get_pixmap(dpi=50)
        arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
        if pix.n >= 3:
            arr = arr[:, :, :3]
        mean_val = np.mean(arr)
        std_val = np.std(arr)
        if std_val < 18 and (mean_val < 45 or (110 <= mean_val <= 150)):
            return True
        return False
    except Exception:
        return False


def process_and_watermark_pdf(input_path, output_path, logo_img=None, opacity=0.15, 
                              remove_header_footer=True, remove_watermark=True,
                              duplicate_first_page=True):
    """
    Cleans third-party headers/footers, strips existing background watermarks, 
    removes any dummy blackout first page, applies brand logo, and optionally duplicates real first page.
    """
    doc = pymupdf.open(input_path)
    new_doc = pymupdf.open()
    total_pages = len(doc)
    
    if total_pages == 0:
        doc.close()
        new_doc.close()
        return 0
        
    # Auto-detect and strip dummy blackout page
    start_idx = 0
    if total_pages > 1 and is_blackout_or_dummy_page(doc[0]):
        start_idx = 1
        
    valid_page_indices = list(range(start_idx, total_pages))
    if not valid_page_indices:
        valid_page_indices = [0]
    
    # If no modifications requested, save directly without re-encoding
    if not remove_header_footer and not remove_watermark and (logo_img is None or opacity <= 0):
        real_p0 = valid_page_indices[0]
        final_seq = ([real_p0] if duplicate_first_page else []) + valid_page_indices
        doc.select(final_seq)
        doc.save(output_path, garbage=4, deflate=True, clean=True)
        final_count = len(doc)
        doc.close()
        new_doc.close()
        return final_count

    wm_ready = None
    if logo_img is not None and opacity > 0:
        logo_rgba = logo_img.convert("RGBA")
        r, g, b, a = logo_rgba.split()
        a = a.point(lambda p: int(p * opacity))
        wm_ready = Image.merge("RGBA", (r, g, b, a))
        
    real_p0 = valid_page_indices[0]
    pages_to_process = ([real_p0] if duplicate_first_page else []) + valid_page_indices
    
    for p_idx in pages_to_process:
        page = doc[p_idx]
        rect = page.rect
        
        pix = page.get_pixmap(dpi=180)
        img_arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
        if pix.n >= 4:
            img_arr = img_arr[:, :, :3]
            
        cleaned_arr = clean_page_array(img_arr, remove_header_footer, remove_watermark)
        pil_img = Image.fromarray(cleaned_arr).convert("RGBA")
        
        if wm_ready is not None:
            target_w = int(pil_img.width * 0.68)
            aspect = wm_ready.height / wm_ready.width
            target_h = int(target_w * aspect)
            wm_resized = wm_ready.resize((target_w, target_h), Image.Resampling.LANCZOS)
            
            pos_x = (pil_img.width - target_w) // 2
            pos_y = (pil_img.height - target_h) // 2
            pil_img.paste(wm_resized, (pos_x, pos_y), wm_resized)
            
        img_bytes_io = io.BytesIO()
        pil_img.convert("RGB").save(img_bytes_io, format='JPEG', quality=88, optimize=True)
        img_bytes = img_bytes_io.getvalue()
        
        new_page = new_doc.new_page(width=rect.width, height=rect.height)
        new_page.insert_image(new_page.rect, stream=img_bytes)
        
    new_doc.save(output_path, deflate=True)
    final_count = len(new_doc)
    new_doc.close()
    doc.close()
    return final_count


def merge_pdf_files(file_list, output_path, toc_items=None, log_cb=None):
    """
    Fast and lossless sequential merger with full outline/table-of-contents support.
    file_list: list of filepaths or tuples (title, filepath)
    """
    merged_doc = pymupdf.open()
    toc = []
    page_offset = 1
    
    for item in file_list:
        if isinstance(item, tuple) or isinstance(item, list):
            title = item[0]
            fpath = item[1]
        else:
            fpath = item
            title = os.path.basename(fpath).replace('.pdf', '')
            
        if not os.path.exists(fpath):
            continue
            
        doc_item = pymupdf.open(fpath)
        p_cnt = len(doc_item)
        
        toc.append([1, title, page_offset])
        merged_doc.insert_pdf(doc_item)
        page_offset += p_cnt
        doc_item.close()
        
    if toc_items:
        merged_doc.set_toc(toc_items)
    else:
        merged_doc.set_toc(toc)
        
    merged_doc.save(output_path, deflate=True)
    merged_doc.close()
    return page_offset - 1
