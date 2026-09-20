import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
import os
import sys
import time
import shutil
import glob
import re
from PIL import Image, ImageTk
import pymupdf

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from core.processor import (
    scrape_all_download_items, 
    extract_drive_id_from_page,
    download_google_drive_file,
    download_direct_url,
    download_file_smart,
    process_and_watermark_pdf,
    merge_pdf_files,
    natural_sort_key
)

DEFAULT_LOGO_PATH = os.path.join(BASE_DIR, "..", "public", "logo.webp")
if not os.path.exists(DEFAULT_LOGO_PATH):
    DEFAULT_LOGO_PATH = os.path.join(BASE_DIR, "assets", "default_logo.webp")

class PDFNotesCleanerApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("PDF Notes Studio | Pak Parcha AI")
        self.geometry("920x860")
        self.minsize(820, 740)
        self.configure(bg="#0F172A") # Dark slate
        
        # Shared Branding Variables
        self.logo_path = tk.StringVar(value=os.path.abspath(DEFAULT_LOGO_PATH) if os.path.exists(DEFAULT_LOGO_PATH) else "")
        self.output_dir = tk.StringVar(value=os.path.expanduser(r"C:\Users\HP\Downloads"))
        self.opacity_var = tk.DoubleVar(value=0.15)
        self.clean_hf_var = tk.BooleanVar(value=True)
        self.clean_wm_var = tk.BooleanVar(value=True)
        self.apply_wm_var = tk.BooleanVar(value=True)
        self.add_blank_page_var = tk.BooleanVar(value=True)
        self.merge_all_var = tk.BooleanVar(value=True)
        
        # Tab 1: Web Scraper
        self.url_var = tk.StringVar(value="https://www.freeilm.com/9th-class-math-notes-full-book-solutions/")
        
        # Tab 2: Local Files Processor
        self.local_folder_var = tk.StringVar(value="")
        self.local_files_list = []
        
        # Tab 3: Merge Only
        self.merge_folder_var = tk.StringVar(value="")
        self.merge_files_list = []
        self.merge_book_title_var = tk.StringVar(value="Complete Book Notes")
        
        self.is_running = False
        self.last_output_dir = None
        
        self.setup_styles()
        self.build_ui()

    def setup_styles(self):
        style = ttk.Style(self)
        style.theme_use("clam")
        
        style.configure(".", background="#0F172A", foreground="#F8FAFC", font=("Segoe UI", 10))
        style.configure("TNotebook", background="#0F172A", borderwidth=0)
        style.configure("TNotebook.Tab", background="#1E293B", foreground="#94A3B8", font=("Segoe UI", 10, "bold"), padding=[16, 8])
        style.map("TNotebook.Tab", background=[("selected", "#0284C7"), ("active", "#334155")], foreground=[("selected", "#FFFFFF")])
        
        style.configure("Card.TFrame", background="#1E293B", relief="flat")
        style.configure("Header.TLabel", font=("Segoe UI", 17, "bold"), foreground="#38BDF8", background="#0F172A")
        style.configure("SubHeader.TLabel", font=("Segoe UI", 10), foreground="#94A3B8", background="#0F172A")
        style.configure("CardTitle.TLabel", font=("Segoe UI", 11, "bold"), foreground="#E2E8F0", background="#1E293B")
        style.configure("TLabel", background="#1E293B", foreground="#CBD5E1")
        style.configure("TCheckbutton", background="#1E293B", foreground="#F1F5F9", font=("Segoe UI", 10))
        style.map("TCheckbutton", background=[("active", "#1E293B")])
        
        style.configure("Primary.TButton", font=("Segoe UI", 11, "bold"), background="#0284C7", foreground="#FFFFFF", borderwidth=0, padding=8)
        style.map("Primary.TButton", background=[("active", "#0369A1"), ("disabled", "#475569")])
        
        style.configure("Secondary.TButton", font=("Segoe UI", 9), background="#334155", foreground="#FFFFFF", borderwidth=0, padding=5)
        style.map("Secondary.TButton", background=[("active", "#475569")])

        style.configure("TProgressbar", thickness=12, troughcolor="#334155", background="#38BDF8")

    def build_ui(self):
        # Header banner
        header_frame = tk.Frame(self, bg="#0F172A", pady=8)
        header_frame.pack(fill="x", padx=20)
        
        lbl_title = ttk.Label(header_frame, text="⚡ PDF Notes Studio & Re-Brander", style="Header.TLabel")
        lbl_title.pack(anchor="w")
        lbl_desc = ttk.Label(header_frame, text="Scrape web notes, clean local PDFs, remove headers/footers/watermarks, apply custom watermark, or fast merge.", style="SubHeader.TLabel")
        lbl_desc.pack(anchor="w", pady=(2, 0))

        # Brand Settings Card (Shared across modes)
        brand_card = ttk.Frame(self, style="Card.TFrame", padding=10)
        brand_card.pack(fill="x", padx=20, pady=(4, 6))
        
        brand_title_row = tk.Frame(brand_card, bg="#1E293B")
        brand_title_row.pack(fill="x")
        ttk.Label(brand_title_row, text="🎨 Watermark Logo & Cleaning Settings", style="CardTitle.TLabel").pack(side="left")
        
        logo_row = tk.Frame(brand_card, bg="#1E293B")
        logo_row.pack(fill="x", pady=4)
        ttk.Label(logo_row, text="Logo File:").pack(side="left")
        ent_logo = tk.Entry(logo_row, textvariable=self.logo_path, font=("Segoe UI", 9), bg="#0F172A", fg="#F8FAFC", insertbackground="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#475569")
        ent_logo.pack(side="left", fill="x", expand=True, ipady=3, padx=6)
        ttk.Button(logo_row, text="📁 Browse...", style="Secondary.TButton", command=self.browse_logo).pack(side="left")
        
        ctrl_row = tk.Frame(brand_card, bg="#1E293B")
        ctrl_row.pack(fill="x", pady=(2, 0))
        ttk.Label(ctrl_row, text="Opacity:").pack(side="left")
        self.lbl_opacity_val = ttk.Label(ctrl_row, text=" 15% ", font=("Segoe UI", 9, "bold"), foreground="#38BDF8")
        self.lbl_opacity_val.pack(side="left", padx=4)
        tk.Scale(ctrl_row, from_=0.05, to=0.40, resolution=0.01, orient="horizontal", 
                 variable=self.opacity_var, command=self.on_slider_move, bg="#1E293B", fg="#CBD5E1", 
                 troughcolor="#0F172A", highlightthickness=0, showvalue=0, length=130).pack(side="left", padx=6)
        
        ttk.Checkbutton(ctrl_row, text="Whiten Header/Footer", variable=self.clean_hf_var).pack(side="left", padx=(10, 8))
        ttk.Checkbutton(ctrl_row, text="Remove Old Watermark", variable=self.clean_wm_var).pack(side="left", padx=(0, 8))
        ttk.Checkbutton(ctrl_row, text="Apply Brand Logo", variable=self.apply_wm_var).pack(side="left", padx=(0, 8))
        ttk.Checkbutton(ctrl_row, text="Add Blank 1st Page", variable=self.add_blank_page_var).pack(side="left")

        # Tabs Notebook
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="x", padx=20, pady=4)
        
        # Tab 1: Web Scraper Mode
        tab_web = ttk.Frame(self.notebook, style="Card.TFrame", padding=12)
        self.notebook.add(tab_web, text="🌐 1. Web Auto-Downloader & Cleaner")
        self.build_web_tab(tab_web)
        
        # Tab 2: Local PDF Cleaner Mode
        tab_local = ttk.Frame(self.notebook, style="Card.TFrame", padding=12)
        self.notebook.add(tab_local, text="📁 2. Clean & Brand Local PDFs")
        self.build_local_tab(tab_local)
        
        # Tab 3: Merge Only Mode
        tab_merge = ttk.Frame(self.notebook, style="Card.TFrame", padding=12)
        self.notebook.add(tab_merge, text="📑 3. Fast Merge PDFs Only")
        self.build_merge_tab(tab_merge)

        # Bottom Progress & Log Area
        bottom_card = ttk.Frame(self, style="Card.TFrame", padding=12)
        bottom_card.pack(fill="both", expand=True, padx=20, pady=(6, 10))
        
        self.progress_var = tk.DoubleVar(value=0)
        self.progress_bar = ttk.Progressbar(bottom_card, variable=self.progress_var, maximum=100)
        self.progress_bar.pack(fill="x", pady=(0, 4))
        
        status_row = tk.Frame(bottom_card, bg="#1E293B")
        status_row.pack(fill="x")
        self.lbl_status = ttk.Label(status_row, text="Ready. Select an option above and click Start.", font=("Segoe UI", 9, "italic"), foreground="#94A3B8")
        self.lbl_status.pack(side="left")
        
        self.btn_open_folder = ttk.Button(status_row, text="📂 Open Output Folder", style="Secondary.TButton", command=self.open_output_folder)
        self.btn_open_folder.pack(side="right")

        # Live Log Terminal
        log_frame = tk.Frame(bottom_card, bg="#0F172A", highlightthickness=1, highlightbackground="#334155")
        log_frame.pack(fill="both", expand=True, pady=(6, 0))
        
        self.txt_log = tk.Text(log_frame, bg="#090D16", fg="#38BDF8", insertbackground="#FFFFFF", font=("Consolas", 9), relief="flat", height=8)
        self.txt_log.pack(side="left", fill="both", expand=True, padx=4, pady=4)
        
        scrollbar = tk.Scrollbar(log_frame, command=self.txt_log.yview, bg="#090D16")
        scrollbar.pack(side="right", fill="y")
        self.txt_log.config(yscrollcommand=scrollbar.set)
        
        self.log("✅ PDF Notes Studio ready.")

    def build_web_tab(self, parent):
        ttk.Label(parent, text="Paste Website URL (e.g. FreeILM, TaleemCity, or Direct PDF Link):", style="CardTitle.TLabel").pack(anchor="w")
        
        row1 = tk.Frame(parent, bg="#1E293B")
        row1.pack(fill="x", pady=6)
        ent = tk.Entry(row1, textvariable=self.url_var, font=("Segoe UI", 10), bg="#0F172A", fg="#F8FAFC", insertbackground="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#475569")
        ent.pack(side="left", fill="x", expand=True, ipady=3, padx=(0, 6))
        ttk.Button(row1, text="📋 Paste", style="Secondary.TButton", command=self.paste_to_url).pack(side="left")
        
        row2 = tk.Frame(parent, bg="#1E293B")
        row2.pack(fill="x", pady=4)
        ttk.Label(row2, text="Save Root Folder:").pack(side="left")
        ent_out = tk.Entry(row2, textvariable=self.output_dir, font=("Segoe UI", 9), bg="#0F172A", fg="#F8FAFC", insertbackground="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#475569")
        ent_out.pack(side="left", fill="x", expand=True, ipady=2, padx=6)
        ttk.Button(row2, text="📂 Browse...", style="Secondary.TButton", command=self.browse_output).pack(side="left")
        
        ttk.Label(parent, text="ℹ️ A dedicated folder with the subject name will automatically be created in this location.", font=("Segoe UI", 9), foreground="#94A3B8").pack(anchor="w", pady=(0, 6))
        
        self.btn_start_web = ttk.Button(parent, text="🚀 DOWNLOAD, CLEAN & MERGE FROM WEB", style="Primary.TButton", command=lambda: self.start_thread(self.run_web_automation))
        self.btn_start_web.pack(fill="x", pady=(2, 0))

    def build_local_tab(self, parent):
        ttk.Label(parent, text="Clean, Remove Watermark & Brand Existing PDF Files:", style="CardTitle.TLabel").pack(anchor="w")
        
        row1 = tk.Frame(parent, bg="#1E293B")
        row1.pack(fill="x", pady=6)
        ttk.Label(row1, text="Select Folder with PDFs:").pack(side="left")
        ent_f = tk.Entry(row1, textvariable=self.local_folder_var, font=("Segoe UI", 9), bg="#0F172A", fg="#F8FAFC", insertbackground="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#475569")
        ent_f.pack(side="left", fill="x", expand=True, ipady=2, padx=6)
        ttk.Button(row1, text="📁 Choose Folder...", style="Secondary.TButton", command=self.browse_local_folder).pack(side="left", padx=(0, 4))
        ttk.Button(row1, text="📄 Pick Files...", style="Secondary.TButton", command=self.browse_local_files).pack(side="left")
        
        row_chk = tk.Frame(parent, bg="#1E293B")
        row_chk.pack(fill="x", pady=4)
        ttk.Checkbutton(row_chk, text="Also Merge into 1 Complete Book Master PDF", variable=self.merge_all_var).pack(side="left")
        
        self.btn_start_local = ttk.Button(parent, text="🧹 CLEAN, RE-BRAND & PROCESS LOCAL PDFS", style="Primary.TButton", command=lambda: self.start_thread(self.run_local_automation))
        self.btn_start_local.pack(fill="x", pady=(6, 0))

    def build_merge_tab(self, parent):
        ttk.Label(parent, text="Fast Merge Multiple PDFs into 1 Book (No Alteration / Instant):", style="CardTitle.TLabel").pack(anchor="w")
        
        row1 = tk.Frame(parent, bg="#1E293B")
        row1.pack(fill="x", pady=6)
        ttk.Label(row1, text="PDFs Folder / Files:").pack(side="left")
        ent_m = tk.Entry(row1, textvariable=self.merge_folder_var, font=("Segoe UI", 9), bg="#0F172A", fg="#F8FAFC", insertbackground="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#475569")
        ent_m.pack(side="left", fill="x", expand=True, ipady=2, padx=6)
        ttk.Button(row1, text="📁 Choose Folder...", style="Secondary.TButton", command=self.browse_merge_folder).pack(side="left", padx=(0, 4))
        ttk.Button(row1, text="📄 Pick Files...", style="Secondary.TButton", command=self.browse_merge_files).pack(side="left")
        
        row2 = tk.Frame(parent, bg="#1E293B")
        row2.pack(fill="x", pady=4)
        ttk.Label(row2, text="Merged Book Title:").pack(side="left")
        ent_title = tk.Entry(row2, textvariable=self.merge_book_title_var, font=("Segoe UI", 9), bg="#0F172A", fg="#F8FAFC", insertbackground="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#475569")
        ent_title.pack(side="left", fill="x", expand=True, ipady=2, padx=6)
        
        self.btn_start_merge = ttk.Button(parent, text="📑 FAST MERGE ALL PDFS IN NATURAL SEQUENCE", style="Primary.TButton", command=lambda: self.start_thread(self.run_merge_only))
        self.btn_start_merge.pack(fill="x", pady=(6, 0))

    def paste_to_url(self):
        try:
            txt = self.clipboard_get().strip()
            if txt:
                self.url_var.set(txt)
        except:
            pass

    def on_slider_move(self, val):
        pct = int(float(val) * 100)
        self.lbl_opacity_val.config(text=f" {pct}% ")

    def browse_logo(self):
        f = filedialog.askopenfilename(title="Select Brand Logo Image", filetypes=[("Images", "*.png;*.webp;*.jpg;*.jpeg;*.svg")])
        if f:
            self.logo_path.set(f)

    def browse_output(self):
        d = filedialog.askdirectory(title="Select Output Folder")
        if d:
            self.output_dir.set(d)

    def browse_local_folder(self):
        d = filedialog.askdirectory(title="Select Folder Containing PDF Files")
        if d:
            self.local_folder_var.set(d)
            raw_files = glob.glob(os.path.join(d, "*.pdf"))
            self.local_files_list = sorted(raw_files, key=lambda x: natural_sort_key(os.path.basename(x)))
            self.log(f"📁 Selected folder with {len(self.local_files_list)} PDF files.")

    def browse_local_files(self):
        files = filedialog.askopenfilenames(title="Select PDF Files to Clean", filetypes=[("PDF Files", "*.pdf")])
        if files:
            self.local_files_list = sorted(list(files), key=lambda x: natural_sort_key(os.path.basename(x)))
            self.local_folder_var.set(os.path.dirname(files[0]))
            self.log(f"📄 Selected {len(files)} PDF files.")

    def browse_merge_folder(self):
        d = filedialog.askdirectory(title="Select Folder Containing PDF Files to Merge")
        if d:
            self.merge_folder_var.set(d)
            raw_files = glob.glob(os.path.join(d, "*.pdf"))
            self.merge_files_list = sorted(raw_files, key=lambda x: natural_sort_key(os.path.basename(x)))
            self.log(f"📁 Selected folder with {len(self.merge_files_list)} PDF files to merge.")

    def browse_merge_files(self):
        files = filedialog.askopenfilenames(title="Select PDF Files to Merge", filetypes=[("PDF Files", "*.pdf")])
        if files:
            self.merge_files_list = sorted(list(files), key=lambda x: natural_sort_key(os.path.basename(x)))
            self.merge_folder_var.set(os.path.dirname(files[0]))
            self.log(f"📄 Selected {len(files)} PDF files to merge.")

    def open_output_folder(self):
        target = self.last_output_dir or self.output_dir.get()
        if os.path.exists(target):
            os.startfile(target)
        else:
            messagebox.showwarning("Notice", "Output folder does not exist yet.")

    def log(self, text):
        self.txt_log.insert(tk.END, text + "\n")
        self.txt_log.see(tk.END)

    def set_buttons_state(self, state):
        self.btn_start_web.config(state=state)
        self.btn_start_local.config(state=state)
        self.btn_start_merge.config(state=state)

    def start_thread(self, target_func):
        if self.is_running:
            return
        self.is_running = True
        self.set_buttons_state("disabled")
        threading.Thread(target=target_func, daemon=True).start()

    # --- Mode 1: Web Scraper & Cleaner ---
    def run_web_automation(self):
        try:
            url = self.url_var.get().strip()
            root_out = self.output_dir.get().strip()
            logo_p = self.logo_path.get().strip()
            opacity = self.opacity_var.get()
            clean_hf = self.clean_hf_var.get()
            clean_wm = self.clean_wm_var.get()
            apply_wm = self.apply_wm_var.get()
            merge_all = self.merge_all_var.get()
            
            if not url:
                messagebox.showerror("Error", "Please enter a valid website URL.")
                return
                
            self.progress_var.set(5)
            self.lbl_status.config(text="🔍 Step 1/4: Analyzing URL & discovering notes...")
            self.log("="*50)
            self.log(f"Starting Web Automation: {url}")
            
            subject_title, tasks = scrape_all_download_items(url, log_cb=self.log)
            if not tasks:
                raise Exception("Could not find downloadable notes on this URL. If it requires a login or direct PDF, try copying the direct link or using Tab 2 for local PDFs.")
            
            safe_title = re.sub(r'[\\/*?:"<>|]', '_', subject_title).strip()
            subject_dir = os.path.join(root_out, safe_title)
            temp_dir = os.path.join(subject_dir, "_raw_temp")
            os.makedirs(subject_dir, exist_ok=True)
            os.makedirs(temp_dir, exist_ok=True)
            self.last_output_dir = subject_dir
            
            self.log(f"📁 Created Subject Folder:\n   {subject_dir}")
            
            logo_img = None
            if apply_wm and os.path.exists(logo_p):
                logo_img = Image.open(logo_p)
                self.log(f"🖼️ Brand logo loaded ({logo_img.width}x{logo_img.height}) with {int(opacity*100)}% opacity.")
            
            self.progress_var.set(15)
            self.lbl_status.config(text=f"⬇️ Step 2/4: Downloading & Cleaning {len(tasks)} sections...")
            
            cleaned_files = []
            total_pages_count = 0
            
            for idx, task in enumerate(tasks, 1):
                unit_num = task['unit']
                item_title = task['title']
                page_url = task['url']
                is_direct_pdf = task.get('direct_pdf', False)
                task_drive_id = task.get('drive_id')
                
                self.log(f"\n[{idx}/{len(tasks)}] Processing Unit {unit_num}: {item_title}...")
                
                slug = re.sub(r'[\\/*?:"<>|]', '_', item_title).strip()
                raw_path = os.path.join(temp_dir, f"{slug}.pdf")
                clean_name = f"{safe_title} - Chapter {unit_num} - {item_title}.pdf"
                clean_path = os.path.join(subject_dir, clean_name)
                
                downloaded = False
                if is_direct_pdf:
                    self.log(f"  ⬇️ Downloading direct PDF...")
                    downloaded = download_direct_url(page_url, raw_path, log_cb=self.log)
                elif task_drive_id:
                    self.log(f"  ⬇️ Downloading from Drive...")
                    downloaded = download_google_drive_file(task_drive_id, raw_path, log_cb=self.log)
                else:
                    file_id = extract_drive_id_from_page(page_url)
                    if file_id:
                        self.log(f"  ⬇️ Downloading from Drive...")
                        downloaded = download_google_drive_file(file_id, raw_path, log_cb=self.log)
                    else:
                        self.log(f"  ⚠️ Direct PDF/Drive not found on {page_url}, trying direct fetch...")
                        downloaded = download_file_smart(page_url, raw_path, log_cb=self.log)
                
                if downloaded and os.path.exists(raw_path):
                    self.log(f"  🧹 Cleaning headers, footers & applying watermark...")
                    pages = process_and_watermark_pdf(raw_path, clean_path, logo_img, opacity, clean_hf, clean_wm, add_first_blank_page=self.add_blank_page_var.get())
                    total_pages_count += pages
                    cleaned_files.append((unit_num, item_title, clean_path, pages))
                    self.log(f"  ✅ Saved: {clean_name} ({pages} pages)")
                else:
                    self.log(f"  ❌ Failed to download section.")
                
                pct = 15 + int((idx / len(tasks)) * 65)
                self.progress_var.set(pct)
            
            if merge_all and cleaned_files:
                self.progress_var.set(85)
                self.lbl_status.config(text="📑 Step 3/4: Merging all chapters into Master Complete Book...")
                self.log(f"\nMerging {len(cleaned_files)} sections ({total_pages_count} total pages)...")
                
                merged_doc = pymupdf.open()
                toc = []
                page_offset = 1
                curr_unit = None
                
                for unit_n, it_title, c_path, p_cnt in cleaned_files:
                    if unit_n != curr_unit:
                        curr_unit = unit_n
                        toc.append([1, f"Chapter {unit_n}", page_offset])
                    
                    toc.append([2, it_title, page_offset])
                    doc_item = pymupdf.open(c_path)
                    merged_doc.insert_pdf(doc_item)
                    page_offset += p_cnt
                    doc_item.close()
                    
                merged_doc.set_toc(toc)
                master_book_path = os.path.join(subject_dir, f"{safe_title} - Full Book Complete Notes.pdf")
                merged_doc.save(master_book_path, deflate=True)
                merged_doc.close()
                
                final_mb = os.path.getsize(master_book_path) / (1024 * 1024)
                self.log(f"🎉 MASTER BOOK CREATED: {os.path.basename(master_book_path)} ({final_mb:.2f} MB)")
            
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
                
            self.progress_var.set(100)
            self.lbl_status.config(text="✨ Automation Completed Successfully!")
            self.log("="*50)
            self.log(f"✅ FINISHED! All files saved in:\n{subject_dir}")
            
            messagebox.showinfo("Success", f"Web notes downloaded, cleaned, branded, and merged successfully!\n\nSaved in:\n{subject_dir}")
            
        except Exception as e:
            self.log(f"❌ Error: {e}")
            messagebox.showerror("Error", str(e))
        finally:
            self.is_running = False
            self.set_buttons_state("normal")

    # --- Mode 2: Clean & Brand Local PDF Files ---
    def run_local_automation(self):
        try:
            folder = self.local_folder_var.get().strip()
            files = self.local_files_list
            if not files and folder and os.path.exists(folder):
                raw_files = glob.glob(os.path.join(folder, "*.pdf"))
                files = sorted(raw_files, key=lambda x: natural_sort_key(os.path.basename(x)))
                
            if not files:
                messagebox.showerror("Error", "Please select a folder or pick PDF files to process.")
                return
                
            logo_p = self.logo_path.get().strip()
            opacity = self.opacity_var.get()
            clean_hf = self.clean_hf_var.get()
            clean_wm = self.clean_wm_var.get()
            apply_wm = self.apply_wm_var.get()
            merge_all = self.merge_all_var.get()
            
            parent_dir = os.path.dirname(files[0])
            out_cleaned_dir = os.path.join(parent_dir, "Cleaned_Branded_Notes")
            os.makedirs(out_cleaned_dir, exist_ok=True)
            self.last_output_dir = out_cleaned_dir
            
            logo_img = None
            if apply_wm and os.path.exists(logo_p):
                logo_img = Image.open(logo_p)
                self.log(f"🖼️ Brand logo loaded ({logo_img.width}x{logo_img.height}) with {int(opacity*100)}% opacity.")
                
            self.log("="*50)
            self.log(f"Cleaning {len(files)} local PDF files into:\n{out_cleaned_dir}")
            
            cleaned_list = []
            total_pages = 0
            
            for idx, fpath in enumerate(files, 1):
                fname = os.path.basename(fpath)
                out_path = os.path.join(out_cleaned_dir, f"Cleaned_{fname}")
                
                self.log(f"[{idx}/{len(files)}] Cleaning & Watermarking: {fname}...")
                self.lbl_status.config(text=f"Cleaning [{idx}/{len(files)}]: {fname}...")
                
                pages = process_and_watermark_pdf(fpath, out_path, logo_img, opacity, clean_hf, clean_wm, add_first_blank_page=self.add_blank_page_var.get())
                total_pages += pages
                cleaned_list.append((fname, out_path, pages))
                
                pct = int((idx / len(files)) * 80)
                self.progress_var.set(pct)
                
            if merge_all and cleaned_list:
                self.lbl_status.config(text="Merging cleaned PDFs into single master book...")
                self.log(f"\nMerging {len(cleaned_list)} files ({total_pages} pages)...")
                
                merged_doc = pymupdf.open()
                toc = []
                page_offset = 1
                
                for orig_name, c_path, p_cnt in cleaned_list:
                    clean_title = orig_name.replace('.pdf', '')
                    toc.append([1, clean_title, page_offset])
                    doc_item = pymupdf.open(c_path)
                    merged_doc.insert_pdf(doc_item)
                    page_offset += p_cnt
                    doc_item.close()
                    
                merged_doc.set_toc(toc)
                merged_book_path = os.path.join(out_cleaned_dir, "Complete_Merged_Book_Notes.pdf")
                merged_doc.save(merged_book_path, deflate=True)
                merged_doc.close()
                self.log(f"🎉 MASTER BOOK MERGED: {os.path.basename(merged_book_path)}")
                
            self.progress_var.set(100)
            self.lbl_status.config(text="✨ Local PDF Cleaning Complete!")
            self.log("="*50)
            self.log(f"✅ FINISHED! Output saved in:\n{out_cleaned_dir}")
            messagebox.showinfo("Success", f"All {len(files)} local PDFs cleaned, watermarked, and merged!\n\nSaved in:\n{out_cleaned_dir}")
            
        except Exception as e:
            self.log(f"❌ Error: {e}")
            messagebox.showerror("Error", str(e))
        finally:
            self.is_running = False
            self.set_buttons_state("normal")

    # --- Mode 3: Merge Only ---
    def run_merge_only(self):
        try:
            folder = self.merge_folder_var.get().strip()
            files = self.merge_files_list
            if not files and folder and os.path.exists(folder):
                raw_files = glob.glob(os.path.join(folder, "*.pdf"))
                files = sorted(raw_files, key=lambda x: natural_sort_key(os.path.basename(x)))
                
            if not files:
                messagebox.showerror("Error", "Please select a folder or pick PDF files to merge.")
                return
                
            book_title = self.merge_book_title_var.get().strip() or "Merged_Book_Notes"
            safe_title = re.sub(r'[\\/*?:"<>|]', '_', book_title).strip()
            
            parent_dir = os.path.dirname(files[0])
            out_file = os.path.join(parent_dir, f"{safe_title}.pdf")
            self.last_output_dir = parent_dir
            
            self.log("="*50)
            self.log(f"Fast Merging {len(files)} PDF files into:\n{out_file}")
            self.lbl_status.config(text=f"Merging {len(files)} PDFs...")
            
            merged_doc = pymupdf.open()
            toc = []
            page_offset = 1
            
            for idx, fpath in enumerate(files, 1):
                fname = os.path.basename(fpath)
                doc_item = pymupdf.open(fpath)
                p_cnt = len(doc_item)
                
                title_item = fname.replace('.pdf', '')
                toc.append([1, title_item, page_offset])
                merged_doc.insert_pdf(doc_item)
                page_offset += p_cnt
                doc_item.close()
                
                self.log(f"  + [{idx}/{len(files)}] Added: {fname} ({p_cnt} pages)")
                self.progress_var.set(int((idx / len(files)) * 90))
                
            merged_doc.set_toc(toc)
            merged_doc.save(out_file, deflate=True)
            merged_doc.close()
            
            final_mb = os.path.getsize(out_file) / (1024 * 1024)
            self.progress_var.set(100)
            self.lbl_status.config(text="✨ Merge Complete!")
            self.log("="*50)
            self.log(f"🎉 SUCCESS! Merged {len(files)} PDFs into:\n{out_file} ({final_mb:.2f} MB, {page_offset-1} pages)")
            messagebox.showinfo("Success", f"PDFs merged successfully!\n\nSaved as:\n{out_file}")
            
        except Exception as e:
            self.log(f"❌ Error: {e}")
            messagebox.showerror("Error", str(e))
        finally:
            self.is_running = False
            self.set_buttons_state("normal")

if __name__ == "__main__":
    app = PDFNotesCleanerApp()
    app.mainloop()
