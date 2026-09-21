import os
import sys
import re
import json
import codecs
import urllib.request
import urllib.parse
import time
import csv

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

def fetch_folder_items_with_url(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return []

    m = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'", html)
    if not m:
        return []

    raw_str = m.group(1)
    try:
        decoded = codecs.decode(raw_str, 'unicode_escape')
        data = json.loads(decoded)
        
        item_list = []
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
            if len(data[0]) > 0 and isinstance(data[0][0], list):
                item_list = data[0]
            else:
                item_list = data
        else:
            item_list = data

        results = []
        for it in item_list:
            if isinstance(it, list) and len(it) >= 4 and isinstance(it[0], str):
                fid = it[0]
                name = str(it[2])
                mime = str(it[3])
                is_folder = (mime == 'application/vnd.google-apps.folder')
                results.append({
                    'id': fid,
                    'name': name,
                    'mimeType': mime,
                    'is_folder': is_folder
                })
        return results
    except Exception as e:
        print(f"JSON error: {e}")
        return []

def get_all_folder_files(fid):
    # 1. Fetch default (Ascending)
    url_asc = f'https://drive.google.com/drive/folders/{fid}'
    items_asc = fetch_folder_items_with_url(url_asc)
    
    # 2. Fetch Descending
    url_desc = f'https://drive.google.com/drive/folders/{fid}?sort=14&direction=d'
    items_desc = fetch_folder_items_with_url(url_desc)
    
    # Merge unique files by ID
    merged = {}
    for it in items_asc + items_desc:
        if not it['is_folder']:
            merged[it['id']] = it
            
    return list(merged.values())

def full_crawl_class10():
    root_id = '1dLyda8bUfo7a4QzlpgDfzxCK7OucbTNj'
    print(f"=== FULL CRAWL CLASS 10 GOOGLE DRIVE (ASC + DESC) ===")
    
    root_items = fetch_folder_items_with_url(f'https://drive.google.com/drive/folders/{root_id}')
    print(f"Found {len(root_items)} root subject folders")
    
    all_files = []
    subject_summary = {}

    for r_item in root_items:
        rfid = r_item[0] if isinstance(r_item, list) else r_item['id']
        rfname = r_item[2] if isinstance(r_item, list) else r_item['name']
        
        print(f"\nScanning: {rfname} (ID: {rfid})...", flush=True)
        files = get_all_folder_files(rfid)
        print(f"  -> Found {len(files)} total unique files!", flush=True)
        
        subject_summary[rfname] = len(files)
        for f in files:
            f['subject_folder'] = rfname
            all_files.append(f)
            
    print(f"\n=======================================================")
    print(f"TOTAL CLASS 10 FILES EXTRACTED ACROSS DRIVE: {len(all_files)}")
    print(f"BREAKDOWN BY SUBJECT:")
    for subj, count in sorted(subject_summary.items()):
        print(f"  - {subj}: {count} files")
        
    return all_files

def generate_csv_and_json(files):
    print(f"\nGenerating updated Class 10 CSV and JSON with ALL {len(files)} items...")
    rows = []
    
    for item in files:
        fname = item['name']
        fid = item['id']
        folder = item['subject_folder']
        
        # Subject detection
        subject = 'General'
        full_text = f"{folder} {fname}".lower()
        
        if 'biology' in full_text:
            subject = 'Biology'
        elif 'chemistry' in full_text:
            subject = 'Chemistry'
        elif 'computer' in full_text:
            subject = 'Computer Science'
        elif 'english' in full_text or 'eng ' in full_text:
            subject = 'English'
        elif 'islamiat' in full_text or 'islamic' in full_text:
            subject = 'Islamiat'
        elif 'math' in full_text:
            subject = 'Mathematics'
        elif 'pak studies' in full_text or 'pakistan' in full_text:
            subject = 'Pakistan Studies'
        elif 'physics' in full_text:
            subject = 'Physics'
        elif 'tarjuma' in full_text or 'quran' in full_text:
            subject = 'Tarjuma-tul-Quran'
        elif 'urdu' in full_text:
            subject = 'Urdu'
            
        # Clean title
        clean_title = fname.replace('.pdf', '').replace('Cleaned_', '').replace('_', ' ')
        clean_title = re.sub(r'\s+', ' ', clean_title).strip()
        
        # Scope and Unit
        is_full_book = bool(re.search(r'full\s*book|complete|merged', clean_title, re.IGNORECASE))
        scope = 'FULL_BOOK' if is_full_book else 'CHAPTER_WISE'
        
        unit_match = re.search(r'(?:unit|chapter|ch)\s*0?(\d+)', clean_title, re.IGNORECASE)
        unit = unit_match.group(1) if unit_match else ('' if is_full_book else '1')
        
        # NoteType
        if is_full_book:
            note_type = 'Full Book Complete'
        elif re.search(r'mcq', clean_title, re.IGNORECASE):
            note_type = 'Solved MCQs'
        elif re.search(r'short', clean_title, re.IGNORECASE) and re.search(r'long', clean_title, re.IGNORECASE):
            note_type = 'Short & Long Q&A'
        elif re.search(r'short', clean_title, re.IGNORECASE):
            note_type = 'Short Questions'
        elif re.search(r'long', clean_title, re.IGNORECASE):
            note_type = 'Long Questions'
        elif re.search(r'numerical|exercise', clean_title, re.IGNORECASE):
            note_type = 'Solved Numericals'
        else:
            note_type = 'Chapter Questions'
            
        file_url = f"https://drive.google.com/file/d/{fid}/preview"
        
        unit_desc_str = f"Unit {unit}" if unit else "Full Book Complete Syllabus"
        description = f"""### Comprehensive {subject} Class 10 ({unit_desc_str}) Notes & Solutions

These {subject} notes for Class 10 ({clean_title}) are prepared strictly according to the Single National Curriculum (SNC 2025–2026) and Punjab Curriculum and Textbook Board (PCTB) standards.

#### 📌 Included In This Resource:
1. **Multiple Choice Questions (MCQs):** Carefully curated objective questions with verified answer keys.
2. **Short Answer Questions:** Concise, exam-targeted answers highlighting key definitions, laws, and concepts.
3. **Long & Detailed Questions:** Step-by-step explanations, diagrams, derivations, and board-standard headings.
4. **Textbook Solved Exercises & Numericals:** Complete solved numericals and exercises with given data, formula substitution, and final units.

#### 🏛️ Board Compatibility:
- **Punjab Boards:** Lahore, Rawalpindi, Gujranwala, Faisalabad, Multan, Sargodha, Sahiwal, Bahawalpur, DG Khan.
- **Federal Board (FBISE):** Islamabad & Cantonment Institutions.
- **KPK & Sindh Boards:** Aligned with Single National Curriculum standards.

#### 💡 Exam Preparation Tips:
- Review past 5-year board questions included at the end of each topic.
- Practice diagrams, derivations, and formulas regularly.
- Memorize key definitions and bold terms for maximum score."""

        rows.append({
            'Title': clean_title,
            'Subject': subject,
            'Grade': '10',
            'Board': 'PCTB (Punjab Curriculum & Textbook Board)',
            'Scope': scope,
            'Unit': unit,
            'NoteType': note_type,
            'Author': 'TaleemCity / PakParcha',
            'FileURL': file_url,
            'Description': description
        })

    # Sort rows by Subject and Title
    rows.sort(key=lambda x: (x['Subject'], x['Scope'] != 'FULL_BOOK', int(x['Unit']) if x['Unit'].isdigit() else 999, x['Title']))

    # Write CSV
    csv_filename = 'Class10_Notes_Import.csv'
    fieldnames = ['Title', 'Subject', 'Grade', 'Board', 'Scope', 'Unit', 'NoteType', 'Author', 'FileURL', 'Description']
    with open(csv_filename, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
    print(f"Generated {csv_filename} with {len(rows)} records!")
    
    # Write JSON
    json_filename = 'Class10_Notes_Import.json'
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(rows, f, indent=2, ensure_ascii=False)
    print(f"Generated {json_filename} with {len(rows)} records!")

if __name__ == '__main__':
    files = full_crawl_class10()
    generate_csv_and_json(files)
