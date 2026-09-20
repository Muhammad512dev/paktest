import os
import re
import json
import csv

def generate_csv():
    with open('crawled_drive_files.json', 'r', encoding='utf-8') as f:
        files = json.load(f)
        
    print(f"Loaded {len(files)} files from Google Drive crawl.")
    
    rows = []
    
    for item in files:
        fname = item['name']
        fid = item['id']
        folder = item['folder_name']
        full_path = item['full_path']
        
        # Determine subject from folder or filename
        subject = 'General'
        if 'biology' in folder.lower() or 'biology' in fname.lower():
            subject = 'Biology'
        elif 'chemistry' in folder.lower() or 'chemistry' in fname.lower():
            subject = 'Chemistry'
        elif 'computer' in folder.lower() or 'computer' in fname.lower():
            subject = 'Computer Science'
        elif 'english' in folder.lower() or 'english' in fname.lower() or 'eng ' in fname.lower():
            subject = 'English'
        elif 'islamiat' in folder.lower() or 'islamiat' in fname.lower():
            subject = 'Islamiat'
        elif 'math' in folder.lower() or 'math' in fname.lower():
            subject = 'Mathematics'
        elif 'pak studies' in folder.lower() or 'pakistan' in fname.lower() or 'pak ' in fname.lower():
            subject = 'Pakistan Studies'
        elif 'physics' in folder.lower() or 'physics' in fname.lower():
            subject = 'Physics'
        elif 'tarjuma' in folder.lower() or 'quran' in fname.lower():
            subject = 'Tarjuma-tul-Quran'
        elif 'urdu' in folder.lower() or 'urdu' in fname.lower():
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
        description = f"""### Comprehensive {subject} Class 9 ({unit_desc_str}) Notes & Solutions

These {subject} notes for Class 9 ({clean_title}) are prepared strictly according to the Single National Curriculum (SNC 2025–2026) and Punjab Curriculum and Textbook Board (PCTB) standards.

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
            'Grade': '9',
            'Board': 'PCTB (Punjab Curriculum & Textbook Board)',
            'Scope': scope,
            'Unit': unit,
            'NoteType': note_type,
            'Author': 'TaleemCity / PakParcha',
            'FileURL': file_url,
            'Description': description
        })
        
    # Write to CSV
    csv_filename = 'Class9_Notes_Import.csv'
    fieldnames = ['Title', 'Subject', 'Grade', 'Board', 'Scope', 'Unit', 'NoteType', 'Author', 'FileURL', 'Description']
    
    with open(csv_filename, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
            
    print(f"Successfully generated CSV with {len(rows)} records at: {csv_filename}")
    
    # Also generate JSON import file
    json_filename = 'Class9_Notes_Import.json'
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(rows, f, indent=2, ensure_ascii=False)
    print(f"Successfully generated JSON at: {json_filename}")

if __name__ == '__main__':
    generate_csv()
