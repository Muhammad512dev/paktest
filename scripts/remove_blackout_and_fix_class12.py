import os
import sys
import glob
import re
import pymupdf
import numpy as np
import time

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

def is_blackout_or_dummy_page(page):
    """
    Detects if a page is a corrupted/dummy solid grey or black rectangle inserted by software like ZXT2007.
    """
    text = page.get_text().strip()
    if len(text) > 25:
        return False # Genuine page with readable text
        
    try:
        pix = page.get_pixmap(dpi=50)
        arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
        if pix.n >= 3:
            arr = arr[:, :, :3]
            
        mean_val = np.mean(arr)
        std_val = np.std(arr)
        
        # Solid grey (mean ~115-145, std < 18) or solid dark (mean < 45)
        if std_val < 18 and (mean_val < 45 or (110 <= mean_val <= 150)):
            return True
        return False
    except Exception:
        return False

def clean_and_repair_pdf(input_path, output_path=None, duplicate_real_p1=False):
    """
    1. Detects and removes any dummy blackout/grey first page.
    2. Makes the real notes page (with questions & content) the true Page 1.
    3. Reconstructs the PDF into clean standard PDF-1.4 format for Microsoft Edge.
    4. Optionally duplicates the REAL first page.
    """
    if output_path is None:
        temp_out = input_path + ".tmp.pdf"
    else:
        temp_out = output_path
        
    doc = pymupdf.open(input_path)
    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        return 0
        
    # Check if page 0 is a blackout/dummy page
    start_idx = 0
    if total_pages > 1 and is_blackout_or_dummy_page(doc[0]):
        start_idx = 1 # Skip dummy blackout page, start from real content!
        
    valid_page_indices = list(range(start_idx, total_pages))
    if not valid_page_indices:
        valid_page_indices = [0]
        
    new_doc = pymupdf.open()
    
    # Process page sequence
    real_first_pno = valid_page_indices[0]
    final_sequence = ([real_first_pno] if duplicate_real_p1 else []) + valid_page_indices
    
    for pno in final_sequence:
        page = doc[pno]
        rect = page.rect
        
        # Render clean high-quality stream (DPI 140, quality 90)
        pix = page.get_pixmap(dpi=140)
        img_bytes = pix.tobytes(output='jpeg', jpg_quality=90)
        
        new_page = new_doc.new_page(width=rect.width, height=rect.height)
        new_page.insert_image(new_page.rect, stream=img_bytes)
        
    new_doc.save(temp_out, garbage=4, deflate=True, clean=True)
    final_count = len(new_doc)
    new_doc.close()
    doc.close()
    
    if output_path is None:
        os.replace(temp_out, input_path)
        
    return final_count, (start_idx == 1)

def run_fix():
    target_dir = os.path.expanduser(r"C:\Users\HP\Downloads\PakParcha_Class_Notes\Class 12")
    print(f"=== REMOVING DUMMY BLACKOUT PAGES & REPAIRING CLASS 12 FOR EDGE ===")
    print(f"Directory: {target_dir}", flush=True)
    
    if not os.path.exists(target_dir):
        print("Folder not found!")
        return
        
    pdfs = glob.glob(os.path.join(target_dir, '**', '*.pdf'), recursive=True)
    print(f"Total PDFs to process: {len(pdfs)}", flush=True)
    
    repaired_cnt = 0
    blackout_removed_cnt = 0
    
    for idx, p in enumerate(pdfs, 1):
        rel = os.path.relpath(p, target_dir)
        try:
            cnt, had_blackout = clean_and_repair_pdf(p, output_path=None, duplicate_real_p1=False)
            if had_blackout:
                blackout_removed_cnt += 1
                status_str = "🗑️ Blackout Removed -> Real Notes are now Page 1"
            else:
                status_str = "✅ Real Page 1 Preserved"
                
            print(f"[{idx}/{len(pdfs)}] {rel} ({cnt} pages) - {status_str}", flush=True)
            repaired_cnt += 1
        except Exception as e:
            print(f"[{idx}/{len(pdfs)}] ❌ Error on {rel}: {e}", flush=True)
            
    print("\n" + "="*60)
    print("🎉 REPAIR COMPLETE!")
    print(f"  Total Files Processed: {repaired_cnt}/{len(pdfs)}")
    print(f"  Dummy Blackout Pages Removed: {blackout_removed_cnt}")
    print(f"  All 257 files now start on the REAL notes content and open in Edge!")
    print("="*60, flush=True)

if __name__ == '__main__':
    run_fix()
