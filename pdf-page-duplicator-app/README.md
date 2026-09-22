# 📄 PDF Page Duplicator Studio (Pak Parcha AI)

A dedicated, ultra-fast, and 100% lossless desktop GUI application to duplicate pages in PDF documents (single files or batch entire folders).

---

## ✨ Key Features

1. **📄 Single PDF Duplicator Mode:**
   - Select any PDF file.
   - Choose which page to duplicate (Default: Page 1, or any custom page number).
   - Choose how many duplicate copies to insert (1, 2, 3...).
   - Choose insertion position (*Right After Page*, *At Very Start of Document*, or *At Very End*).
   - 1-Click Save with custom output path.

2. **📁 Batch Folder Duplicator Mode:**
   - Select a folder with hundreds of PDF files (or pick multiple files).
   - Batch duplicates the target page across all files automatically.
   - Saves all output files neatly into a `Duplicated_PDFs` folder.
   - Real-time progress bar, live activity terminal log, and instant "Open Output Folder" button.

3. **⚡ 100% Lossless & Instant:**
   - Powered by PyMuPDF (`pymupdf`) direct vector page insertion.
   - Preserves original resolution, embedded fonts, vector graphics, and annotations with zero quality loss in milliseconds.

---

## 🚀 How to Run

Simply double-click:
```bat
Launch_App.bat
```
Or run from the command line:
```bash
python app_gui.py
```
