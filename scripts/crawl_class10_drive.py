import os
import sys
import re
import json
import codecs
import urllib.request
import urllib.parse
import time
import csv

# Force UTF-8 for console output on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def fetch_folder_items(folder_id):
    url = f'https://drive.google.com/drive/folders/{folder_id}'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Failed to fetch {folder_id}: {e}")
        return []

    # Find window['_DRIVE_ivd']
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
                parent_id = it[1][0] if (len(it) > 1 and isinstance(it[1], list) and it[1]) else folder_id
                name = str(it[2])
                mime = str(it[3])
                is_folder = (mime == 'application/vnd.google-apps.folder')
                results.append({
                    'id': fid,
                    'name': name,
                    'mimeType': mime,
                    'is_folder': is_folder,
                    'parent_id': parent_id
                })
        return results
    except Exception as e:
        print(f"Error parsing JSON for {folder_id}: {e}")
        return []

def recursive_crawl():
    root_id = '1dLyda8bUfo7a4QzlpgDfzxCK7OucbTNj'
    print(f"Starting recursive crawl on Class 10 Google Drive: {root_id}")
    
    all_files = []
    folders_to_visit = [{'id': root_id, 'name': 'Class 10 Root', 'path': ''}]
    visited_folders = set()
    
    while folders_to_visit:
        current_folder = folders_to_visit.pop(0)
        fid = current_folder['id']
        fname = current_folder['name']
        fpath = current_folder['path']
        
        if fid in visited_folders:
            continue
        visited_folders.add(fid)
        
        print(f"\n[SCANNING] Folder: {fname} (ID: {fid})")
        items = fetch_folder_items(fid)
        print(f"   Found {len(items)} items inside.")
        
        for item in items:
            # Skip temp raw folders
            if item['name'].startswith('_temp'):
                continue
                
            item_path = f"{fpath} / {item['name']}" if fpath else item['name']
            if item['is_folder']:
                print(f"   -> [FOLDER] {item['name']} (ID: {item['id']})")
                folders_to_visit.append({
                    'id': item['id'],
                    'name': item['name'],
                    'path': item_path
                })
            else:
                print(f"   -> [FILE] {item['name']} (ID: {item['id']})")
                all_files.append({
                    'id': item['id'],
                    'name': item['name'],
                    'mimeType': item['mimeType'],
                    'folder_name': fname,
                    'folder_id': fid,
                    'full_path': item_path
                })
        
        time.sleep(0.3)
        
    print(f"\n======================================")
    print(f"TOTAL CLEAN CLASS 10 FILES FOUND: {len(all_files)}")
    print(f"TOTAL FOLDERS SCANNED: {len(visited_folders)}")
    
    with open('crawled_class10_drive_files.json', 'w', encoding='utf-8') as f:
        json.dump(all_files, f, indent=2, ensure_ascii=False)
        
    return all_files

def generate_csv_and_json(files):
    print(f"\nGenerating Class 10 CSV and JSON import files for {len(files)} items...")
    rows = []
    
    for item in files:
        fname = item['name']
        fid = item['id']
        folder = item['folder_name']
        full_path = item['full_path']
        
        # Determine subject from folder or filename
        subject = 'General'
        full_text = f"{folder} {fname} {full_path}".lower()
        
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
        elif 'pak studies' in full_text or 'pakistan' in full_text or 'pak ' in full_text:
            subject = 'Pakistan Studies'
        elif 'physics' in full_text:
            subject = 'Physics'
        elif 'tarjuma' in full_text or 'quran' in full_text:
            subject = 'Tarjuma-tul-Quran'
        elif 'urdu' in full_text:
            subject = 'Urdu'
            
        # Clean up title
        clean_title = fname.replace('.pdf', '').replace('Cleaned_', '').replace('_', ' ')
        clean_title = re.sub(r'\s+', ' ', clean_title).strip()
        
        # Determine Scope and Unit
        is_full_book = bool(re.search(r'full\s*book|complete|merged', clean_title, re.IGNORECASE))
        scope = 'FULL_BOOK' if is_full_book else 'CHAPTER_WISE'
        
        # Extract Unit / Chapter number
        unit_match = re.search(r'(?:unit|chapter|ch)\s*0?(\d+)', clean_title, re.IGNORECASE)
        unit = unit_match.group(1) if unit_match else ('' if is_full_book else '1')
        
        # Determine NoteType
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
            
        # Format preview URL
        file_url = f"https://drive.google.com/file/d/{fid}/preview"
        
        # Build TaleemCity rich description
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
        
    # Write to CSV
    csv_filename = 'Class10_Notes_Import.csv'
    fieldnames = ['Title', 'Subject', 'Grade', 'Board', 'Scope', 'Unit', 'NoteType', 'Author', 'FileURL', 'Description']
    
    with open(csv_filename, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
            
    print(f"Successfully generated CSV with {len(rows)} records at: {csv_filename}")
    
    # Also generate JSON import file
    json_filename = 'Class10_Notes_Import.json'
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(rows, f, indent=2, ensure_ascii=False)
    print(f"Successfully generated JSON at: {json_filename}")

if __name__ == '__main__':
    files = recursive_crawl()
    generate_csv_and_json(files)
