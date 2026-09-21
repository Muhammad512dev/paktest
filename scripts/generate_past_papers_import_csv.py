import json
import csv
import re
import os
import sys

# Ensure UTF-8
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open("crawled_user_past_papers.json", "r", encoding="utf-8") as f:
    items = json.load(f)

print(f"Loaded {len(items)} items from crawled_user_past_papers.json")

def generate_seo_description(subject, year="2026", board="BISE Multan", grade="Class 9 (SSC Part-I)"):
    return f"""### {board} {grade} {subject} Past Paper {year} (1st Annual) With Official Answer Key

Download the authentic **{board} {subject} 9th Class Past Paper {year} (1st Annual Examination)** along with the official board answer key and marking guidelines. This official examination paper has been conducted by the **Board of Intermediate and Secondary Education (BISE) Multan** strictly in accordance with the **Single National Curriculum (SNC 2025–2026)** and Punjab Textbook Board curriculum.

---

#### 📋 Examination Structure & Section Breakdown:
1. **Section-A (Objective Type / MCQs):**
   - Contains all official multiple-choice questions administered in Morning and Evening shifts.
   - Includes official verified answer keys, question code references, and answer bubbles guide.
2. **Section-B (Short Answer Questions):**
   - High-yield conceptual questions, textbook definitions, formula proofs, and fundamental principles.
   - Standard board division with choice guidelines according to current pairing scheme.
3. **Section-C (Long / Descriptive Questions & Solved Numericals):**
   - Detailed conceptual answers, comprehensive derivations, labeled diagrams, and step-by-step solutions.
   - Board standard marks distribution showing sub-part marks allocation.

---

#### 🎯 Key Benefits for Matric Students & Teachers:
- **Understand Real Paper Pattern:** Familiarize yourself with the actual difficulty level, question formats, and examiner preferences of BISE Multan.
- **Master Time Management:** Practice solving under authentic 3-hour examination conditions to maximize accuracy and speed.
- **Identify High-Weightage Topics:** Pinpoint frequently repeated questions and crucial chapters favored in Punjab Board annual exams.
- **Accurate Self-Assessment:** Use the integrated official answer key to evaluate your preparation and eliminate mistakes before final exams.

---

#### 🔍 Top Search Keywords & SEO Tags:
`bise multan 9th class {subject.lower()} past paper {year}` • `class 9 {subject.lower()} solved paper 2026` • `9th class {subject.lower()} question paper with key` • `bise multan ssc part 1 past papers download pdf` • `punjab board matric part 1 {subject.lower()} annual exam {year}` • `9th {subject.lower()} board paper pakparcha`
"""

# 1. Generate StudyNote CSV (for ContentManager Notes/StudyNote table)
study_note_records = []
# 2. Generate PastPaper CSV (for PastPaper table)
past_paper_records = []
json_records = []

for item in items:
    title_raw = item["title"]
    file_id = item["id"]
    
    # Extract subject name from filename
    # e.g. "Advanced Islamic Studies - 9th 1st Annual 2026 Past Paper.pdf" -> "Advanced Islamic Studies"
    subject_match = re.split(r'\s*-\s*9th', title_raw, flags=re.IGNORECASE)
    subject = subject_match[0].strip() if subject_match else title_raw.replace(".pdf", "").strip()
    
    file_url = f"https://drive.google.com/file/d/1{file_id[1:] if file_id.startswith('1') else file_id}/preview"
    direct_view_url = f"https://drive.google.com/file/d/{file_id}/view?usp=sharing"
    
    clean_title = f"{subject} - 9th Class Past Paper 2026 (1st Annual with Key)"
    desc = generate_seo_description(subject=subject, year="2026", board="BISE Multan", grade="Class 9 (SSC Part-I)")
    
    # StudyNote row
    study_note_records.append({
        "Title": clean_title,
        "Subject": subject,
        "Grade": "9",
        "Board": "BISE Multan (Punjab Board)",
        "Scope": "PAST_PAPERS",
        "Unit": "",
        "NoteType": "Past Paper",
        "Author": "BISE Multan / ExamForge",
        "FileURL": file_url,
        "Description": desc
    })
    
    # PastPaper row
    past_paper_records.append({
        "Title": clean_title,
        "Year": 2026,
        "Board": "BISE Multan",
        "Level": "Class 9",
        "Subject": subject,
        "FileURL": file_url,
        "Description": desc
    })
    
    # JSON record
    json_records.append({
        "id": file_id,
        "title": clean_title,
        "subject": subject,
        "grade": "9",
        "year": 2026,
        "board": "BISE Multan",
        "level": "Class 9",
        "noteType": "Past Paper",
        "fileUrl": file_url,
        "viewUrl": direct_view_url,
        "description": desc
    })

# Write StudyNote CSV
csv_notes_path = "Class9_PastPapers_2026_Import.csv"
with open(csv_notes_path, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "Title", "Subject", "Grade", "Board", "Scope", "Unit", "NoteType", "Author", "FileURL", "Description"
    ])
    writer.writeheader()
    writer.writerows(study_note_records)

# Write PastPaper CSV
csv_papers_path = "Class9_PastPapers_Direct_Import.csv"
with open(csv_papers_path, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "Title", "Year", "Board", "Level", "Subject", "FileURL", "Description"
    ])
    writer.writeheader()
    writer.writerows(past_paper_records)

# Write JSON
json_path = "Class9_PastPapers_2026_Import.json"
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_records, f, indent=2, ensure_ascii=False)

print(f"✅ Generated {len(study_note_records)} records successfully!")
print(f"1. Notes/CMS CSV: {csv_notes_path} ({os.path.getsize(csv_notes_path) / 1024:.1f} KB)")
print(f"2. PastPapers CSV: {csv_papers_path} ({os.path.getsize(csv_papers_path) / 1024:.1f} KB)")
print(f"3. Full JSON: {json_path} ({os.path.getsize(json_path) / 1024:.1f} KB)")
