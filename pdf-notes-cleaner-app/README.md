# ⚡ PDF Notes Automation & Re-Brander Tool

A completely standalone desktop software to:
1. **Scrape & Download** complete educational notes from URLs (FreeILM, Google Drive, etc.).
2. **Clean Pages**: Automatically strip third-party website header banners, footer links, and background watermarks.
3. **Re-Brand**: Overlay your custom logo watermark (with adjustable opacity slider).
4. **Merge & Index**: Combine all chapters into a single master book PDF with an interactive Table of Contents.

---

### 🚀 How to Run:

Simply double-click:
```bash
Launch_App.bat
```
Or run from terminal:
```bash
python app_gui.py
```

---

### 📁 Project Layout (Isolated):
```
pdf-notes-cleaner-app/
│
├── Launch_App.bat         # 1-Click Windows Launcher
├── app_gui.py             # Desktop GUI Application (Tkinter)
├── requirements.txt       # Dependencies (PyMuPDF, Pillow, NumPy)
├── core/
│   └── processor.py       # Scraper, cleaner, watermarker & merger engine
└── assets/
    └── default_logo.webp  # Default Pak Parcha AI brand logo
```
