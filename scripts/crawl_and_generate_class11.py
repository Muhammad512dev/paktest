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

def clean_unicode_artifacts(text):
    if not text:
        return ""
    replacements = {
        'â€“': '–',
        'â€”': '—',
        'â€™': "'",
        'â€˜': "'",
        'â€œ': '"',
        'â€': '"',
        'Â': '',
        'â': '-',
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    return text

def get_clean_subject(folder_name, full_path, file_name):
    folder_lower = folder_name.lower()
    path_lower = full_path.lower()
    
    if 'biology' in folder_lower or 'biology' in path_lower:
        return 'Biology'
    if 'chemistry' in folder_lower or 'chemistry' in path_lower:
        return 'Chemistry'
    if 'computer' in folder_lower or 'computer' in path_lower:
        return 'Computer Science'
    if 'english' in folder_lower or 'english' in path_lower:
        return 'English'
    if 'islamiat' in folder_lower or 'islamiat' in path_lower:
        return 'Islamiat'
    if 'mathem' in folder_lower or 'math' in folder_lower or 'math' in path_lower:
        return 'Mathematics'
    if 'tarjuma' in folder_lower or 'quran' in folder_lower or 'tarjuma' in path_lower:
        return 'Tarjuma-tul-Quran'
    if 'physics' in folder_lower or 'physics' in path_lower:
        return 'Physics'
    if 'urdu' in folder_lower or 'urdu' in path_lower:
        return 'Urdu'
    if 'pak' in folder_lower or 'pakistan' in folder_lower:
        return 'Pakistan Studies'
    return 'General'

def generate_csv_and_json():
    with open('crawled_class11_drive_files.json', 'r', encoding='utf-8') as f:
        files = json.load(f)
        
    print(f"Loaded {len(files)} Class 11 files from crawl cache.")
    rows = []
    
    for item in files:
        fname = clean_unicode_artifacts(item['name'])
        fid = item['id']
        folder = item['folder_name']
        full_path = item['full_path']
        
        # Determine subject accurately from folder hierarchy
        subject = get_clean_subject(folder, full_path, fname)
        
        # Determine Scope and Full Book status
        is_full_book = bool(re.search(r'full\s*book|complete_merged|merged_book|complete\s*book', fname, re.IGNORECASE))
        scope = 'FULL_BOOK' if is_full_book else 'CHAPTER_WISE'
        
        # Extract Unit / Chapter number
        unit_match = re.search(r'(?:unit|chapter|ch)\s*0?(\d+)', fname, re.IGNORECASE)
        unit = unit_match.group(1) if unit_match else ('' if is_full_book else '1')
        
        # Determine NoteType
        if is_full_book:
            note_type = 'Full Book Complete'
        elif re.search(r'mcq', fname, re.IGNORECASE):
            note_type = 'Solved MCQs'
        elif re.search(r'short', fname, re.IGNORECASE) and re.search(r'long', fname, re.IGNORECASE):
            note_type = 'Short & Long Q&A'
        elif re.search(r'short', fname, re.IGNORECASE):
            note_type = 'Short Questions'
        elif re.search(r'long', fname, re.IGNORECASE):
            note_type = 'Long Questions'
        elif re.search(r'numerical|exercise', fname, re.IGNORECASE):
            note_type = 'Solved Numericals'
        elif re.search(r'grammar|rudaad|roznaamcha|raseedat|mukaalma|talkhees', fname, re.IGNORECASE):
            note_type = 'Grammar & Composition'
        else:
            note_type = 'Chapter Questions'
            
        # Clean title for display
        raw_title = fname.replace('.pdf', '').replace('Cleaned_', '').replace('_', ' ')
        raw_title = re.sub(r'\s+', ' ', raw_title).strip()
        
        if is_full_book:
            clean_title = f"{subject} Class 11 - Full Book Complete Notes"
        else:
            if not subject.lower() in raw_title.lower():
                clean_title = f"{subject} Class 11 - {raw_title}"
            else:
                clean_title = raw_title
                
        # Format Google Drive preview URL
        file_url = f"https://drive.google.com/file/d/{fid}/preview"
        
        # Build High-Ranking TaleemCity/PakParcha SEO rich description
        unit_desc_str = f"Chapter {unit}" if unit else "Full Book Complete Syllabus"
        description = f"""### Comprehensive 1st Year / Class 11 {subject} ({unit_desc_str}) Notes & Solutions (HSSC-I)

Get the best 1st Year (Class 11 / HSSC Part 1) {subject} notes for **{clean_title}**. These high-yield study materials are designed strictly according to the latest National Curriculum 2025–2026, Punjab Curriculum & Textbook Board (PCTB), and Federal Board (FBISE) syllabus standards.

#### 📌 What's Included in this 11th Class {subject} Guide:
1. **Topic-wise Short Questions & Conceptual Answers:** Comprehensive answers with high-scoring keywords, scientific terminology, and clear definitions.
2. **Solved Long Questions & Detailed Derivations:** Step-by-step explanations, labeled diagrams, mathematical derivations, and board-standard structured headings.
3. **Multiple Choice Questions (Solved MCQs):** High-frequency exam MCQs with 100% verified correct options and conceptual rationales.
4. **Textbook Exercise Solutions & Solved Numericals:** Complete, step-by-step solutions to all textbook review questions, exercises, and numerical problems with standard formulas and units.

#### 🏛️ Applicable for All Intermediate Boards across Pakistan:
- **Punjab Boards:** Lahore, Rawalpindi, Gujranwala, Faisalabad, Multan, Sargodha, Sahiwal, Bahawalpur, and DG Khan Board.
- **Federal Board (FBISE):** Islamabad Model Colleges, Army Public Schools & Overseas Examination Centers.
- **KPK, Sindh & Balochistan Boards:** Fully compliant with Single National Curriculum SLO-based assessments.

#### 💡 Expert 1st Year Board Exam Tips:
- High priority given to SLO-based (Student Learning Outcomes) conceptual questions.
- Review the past 5-year past paper repeated questions highlighted in this chapter.
- Practice neat presentation with headings, bullet points, and boxed numerical answers for scoring maximum marks."""

        rows.append({
            'Title': clean_title,
            'Subject': subject,
            'Grade': '11',
            'Board': 'PCTB (Punjab Curriculum & Textbook Board)',
            'Scope': scope,
            'Unit': unit,
            'NoteType': note_type,
            'Author': 'TaleemCity / PakParcha',
            'FileURL': file_url,
            'Description': description
        })
        
    # Write to CSV
    csv_filename = 'Class11_Notes_Import.csv'
    fieldnames = ['Title', 'Subject', 'Grade', 'Board', 'Scope', 'Unit', 'NoteType', 'Author', 'FileURL', 'Description']
    
    with open(csv_filename, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
            
    print(f"Successfully generated CSV with {len(rows)} records at: {csv_filename}")
    
    # Also generate JSON import file
    json_filename = 'Class11_Notes_Import.json'
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(rows, f, indent=2, ensure_ascii=False)
    print(f"Successfully generated JSON at: {json_filename}")

if __name__ == '__main__':
    generate_csv_and_json()
