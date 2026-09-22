import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
import os
import sys
import glob
import re
import pymupdf

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def natural_sort_key(s):
    """Sorts alphanumeric strings naturally (e.g. 1, 2, 10 instead of 1, 10, 2)."""
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', str(s))]

def duplicate_pdf_page(input_path, output_path, target_page=1, copies=1, insert_pos="after"):
    """
    Losslessly duplicates a specific page in a PDF and saves the result.
    target_page: 1-based page number (1 for first page).
    copies: number of duplicate copies to create.
    insert_pos: 'after' (right after source page), 'start' (at beginning), 'end' (at end).
    """
    doc = pymupdf.open(input_path)
    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        return 0
    
    # Clamp target page index (0-based)
    page_idx = max(0, min(total_pages - 1, target_page - 1))
    new_doc = pymupdf.open()
    
    if insert_pos == "start":
        for _ in range(copies):
            new_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)
        new_doc.insert_pdf(doc)
    elif insert_pos == "end":
        new_doc.insert_pdf(doc)
        for _ in range(copies):
            new_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)
    else: # "after"
        for i in range(total_pages):
            new_doc.insert_pdf(doc, from_page=i, to_page=i)
            if i == page_idx:
                for _ in range(copies):
                    new_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)
                    
    new_doc.save(output_path, deflate=True)
    final_count = len(new_doc)
    new_doc.close()
    doc.close()
    return final_count


class PDFPageDuplicatorApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("PDF Page Duplicator Studio | Pak Parcha AI")
        self.geometry("860x780")
        self.minsize(780, 680)
        self.configure(bg="#0F172A") # Dark slate
        
        # Variables
        self.single_file_var = tk.StringVar(value="")
        self.single_output_var = tk.StringVar(value="")
        self.batch_folder_var = tk.StringVar(value="")
        self.batch_output_var = tk.StringVar(value="")
        self.batch_files_list = []
        
        # Duplication Settings
        self.target_page_var = tk.IntVar(value=1) # 1 = First Page
        self.copies_var = tk.IntVar(value=1) # 1 duplicate copy
        self.insert_pos_var = tk.StringVar(value="after") # after, start, end
        
        self.is_running = False
        self.last_output_dir = None
        
        self.setup_styles()
        self.build_ui()
        
    def setup_styles(self):
        style = ttk.Style(self)
        style.theme_use("clam")
        
        style.configure(".", background="#0F172A", foreground="#F8FAFC", font=("Segoe UI", 10))
        style.configure("TNotebook", background="#0F172A", borderwidth=0)
        style.configure("TNotebook.Tab", background="#1E293B", foreground="#94A3B8", font=("Segoe UI", 10, "bold"), padding=[18, 9])
        style.map("TNotebook.Tab", background=[("selected", "#0284C7"), ("active", "#334155")], foreground=[("selected", "#FFFFFF")])
        
        style.configure("Card.TFrame", background="#1E293B", relief="flat")
        style.configure("Header.TLabel", font=("Segoe UI", 16, "bold"), foreground="#38BDF8", background="#0F172A")
        style.configure("SubHeader.TLabel", font=("Segoe UI", 10), foreground="#94A3B8", background="#0F172A")
        style.configure("CardTitle.TLabel", font=("Segoe UI", 11, "bold"), foreground="#E2E8F0", background="#1E293B")
        style.configure("TLabel", background="#1E293B", foreground="#CBD5E1")
        style.configure("TRadiobutton", background="#1E293B", foreground="#F1F5F9", font=("Segoe UI", 10))
        style.map("TRadiobutton", background=[("active", "#1E293B")])
        
        style.configure("Primary.TButton", font=("Segoe UI", 11, "bold"), background="#0284C7", foreground="#FFFFFF", borderwidth=0, padding=9)
        style.map("Primary.TButton", background=[("active", "#0369A1"), ("disabled", "#475569")])
        
        style.configure("Secondary.TButton", font=("Segoe UI", 9), background="#334155", foreground="#FFFFFF", borderwidth=0, padding=5)
        style.map("Secondary.TButton", background=[("active", "#475569")])

        style.configure("TProgressbar", thickness=12, troughcolor="#334155", background="#38BDF8")

    def build_ui(self):
        # Header banner
        header_frame = tk.Frame(self, bg="#0F172A", pady=8)
        header_frame.pack(fill="x", padx=20)
        
        lbl_title = ttk.Label(header_frame, text="📄 PDF Page Duplicator Studio", style="Header.TLabel")
        lbl_title.pack(anchor="w")
        lbl_desc = ttk.Label(header_frame, text="Instantly and losslessly duplicate page 1 (or any page) in single PDFs or batch entire folders.", style="SubHeader.TLabel")
        lbl_desc.pack(anchor="w", pady=(2, 0))

        # Shared Duplication Config Card
        cfg_card = ttk.Frame(self, style="Card.TFrame", padding=12)
        cfg_card.pack(fill="x", padx=20, pady=(4, 6))
        
        ttk.Label(cfg_card, text="⚙️ Duplication Configuration", style="CardTitle.TLabel").pack(anchor="w", pady=(0, 6))
        
        row_cfg = tk.Frame(cfg_card, bg="#1E293B")
        row_cfg.pack(fill="x")
        
        # Target Page
        ttk.Label(row_cfg, text="Target Page:").pack(side="left")
        spn_page = tk.Spinbox(row_cfg, from_=1, to=9999, textvariable=self.target_page_var, width=5, font=("Segoe UI", 10), bg="#0F172A", fg="#F8FAFC", insertbackground="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#475569")
        spn_page.pack(side="left", padx=(6, 18))
        
        # Number of Copies
        ttk.Label(row_cfg, text="Copies to Add:").pack(side="left")
        spn_copies = tk.Spinbox(row_cfg, from_=1, to=10, textvariable=self.copies_var, width=4, font=("Segoe UI", 10), bg="#0F172A", fg="#F8FAFC", insertbackground="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#475569")
        spn_copies.pack(side="left", padx=(6, 18))
        
        # Position
        ttk.Label(row_cfg, text="Insert Position:").pack(side="left")
        ttk.Radiobutton(row_cfg, text="Right After Page", variable=self.insert_pos_var, value="after").pack(side="left", padx=4)
        ttk.Radiobutton(row_cfg, text="At Very Start", variable=self.insert_pos_var, value="start").pack(side="left", padx=4)
        ttk.Radiobutton(row_cfg, text="At Very End", variable=self.insert_pos_var, value="end").pack(side="left", padx=4)

        # Tabs Notebook
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="x", padx=20, pady=4)
        
        # Tab 1: Single File Duplicator
        tab_single = ttk.Frame(self.notebook, style="Card.TFrame", padding=14)
        self.notebook.add(tab_single, text="📄 1. Single PDF Duplicator")
        self.build_single_tab(tab_single)
        
        # Tab 2: Batch Folder Duplicator
        tab_batch = ttk.Frame(self.notebook, style="Card.TFrame", padding=14)
        self.notebook.add(tab_batch, text="📁 2. Batch Folder Duplicator")
        self.build_batch_tab(tab_batch)

        # Bottom Progress & Log Area
        bottom_card = ttk.Frame(self, style="Card.TFrame", padding=12)
        bottom_card.pack(fill="both", expand=True, padx=20, pady=(6, 10))
        
        self.progress_var = tk.DoubleVar(value=0)
        self.progress_bar = ttk.Progressbar(bottom_card, variable=self.progress_var, maximum=100)
        self.progress_bar.pack(fill="x", pady=(0, 4))
        
        status_row = tk.Frame(bottom_card, bg="#1E293B")
        status_row.pack(fill="x")
        self.lbl_status = ttk.Label(status_row, text="Ready. Select a file or folder above and click Duplicate.", font=("Segoe UI", 9, "italic"), foreground="#94A3B8")
        self.lbl_status.pack(side="left")
        
        self.btn_open_folder = ttk.Button(status_row, text="📂 Open Output Folder", style="Secondary.TButton", command=self.open_output_folder)
        self.btn_open_folder.pack(side="right")

        # Terminal Log Box
        log_frame = tk.Frame(bottom_card, bg="#0F172A", highlightthickness=1, highlightbackground="#334155")
        log_frame.pack(fill="both", expand=True, pady=(6, 0))
        
        self.txt_log = tk.Text(log_frame, bg="#090D16", fg="#38BDF8", insertbackground="#FFFFFF", font=("Consolas", 9), relief="flat", height=7)
        self.txt_log.pack(side="left", fill="both", expand=True, padx=4, pady=4)
        
        scrollbar = tk.Scrollbar(log_frame, command=self.txt_log.yview, bg="#090D16")
        scrollbar.pack(side="right", fill="y")
        self.txt_log.config(yscrollcommand=scrollbar.set)
        
        self.log("✅ PDF Page Duplicator Studio ready. Lossless vector engine initialized.")

    def build_single_tab(self, parent):
        ttk.Label(parent, text="Select a PDF File to Duplicate Page:", style="CardTitle.TLabel").pack(anchor="w")
        
        row1 = tk.Frame(parent, bg="#1E293B")
        row1.pack(fill="x", pady=6)
        ttk.Label(row1, text="Source PDF:").pack(side="left")
        ent = tk.Entry(row1, textvariable=self.single_file_var, font=("Segoe UI", 10), bg="#0F172A", fg="#F8FAFC", insertbackground="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#475569")
        ent.pack(side="left", fill="x", expand=True, ipady=3, padx=6)
        ttk.Button(row1, text="📄 Choose PDF...", style="Secondary.TButton", command=self.browse_single_file).pack(side="left")
        
        row2 = tk.Frame(parent, bg="#1E293B")
        row2.pack(fill="x", pady=4)
        ttk.Label(row2, text="Save As:").pack(side="left")
        ent_out = tk.Entry(row2, textvariable=self.single_output_var, font=("Segoe UI", 9), bg="#0F172A", fg="#F8FAFC", insertbackground="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#475569")
        ent_out.pack(side="left", fill="x", expand=True, ipady=2, padx=6)
        ttk.Button(row2, text="📁 Save Path...", style="Secondary.TButton", command=self.browse_single_output).pack(side="left")
        
        self.btn_start_single = ttk.Button(parent, text="✨ DUPLICATE PAGE & SAVE PDF", style="Primary.TButton", command=lambda: self.start_thread(self.run_single_duplication))
        self.btn_start_single.pack(fill="x", pady=(10, 0))

    def build_batch_tab(self, parent):
        ttk.Label(parent, text="Batch Duplicate Page Across Multiple PDFs / Folders:", style="CardTitle.TLabel").pack(anchor="w")
        
        row1 = tk.Frame(parent, bg="#1E293B")
        row1.pack(fill="x", pady=6)
        ttk.Label(row1, text="Input Folder:").pack(side="left")
        ent = tk.Entry(row1, textvariable=self.batch_folder_var, font=("Segoe UI", 9), bg="#0F172A", fg="#F8FAFC", insertbackground="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#475569")
        ent.pack(side="left", fill="x", expand=True, ipady=2, padx=6)
        ttk.Button(row1, text="📁 Choose Folder...", style="Secondary.TButton", command=self.browse_batch_folder).pack(side="left", padx=(0, 4))
        ttk.Button(row1, text="📄 Pick Files...", style="Secondary.TButton", command=self.browse_batch_files).pack(side="left")
        
        row2 = tk.Frame(parent, bg="#1E293B")
        row2.pack(fill="x", pady=4)
        ttk.Label(row2, text="Output Folder:").pack(side="left")
        ent_out = tk.Entry(row2, textvariable=self.batch_output_var, font=("Segoe UI", 9), bg="#0F172A", fg="#F8FAFC", insertbackground="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#475569")
        ent_out.pack(side="left", fill="x", expand=True, ipady=2, padx=6)
        ttk.Button(row2, text="📂 Output Folder...", style="Secondary.TButton", command=self.browse_batch_output).pack(side="left")
        
        self.btn_start_batch = ttk.Button(parent, text="🚀 BATCH DUPLICATE ALL PDFS IN FOLDER", style="Primary.TButton", command=lambda: self.start_thread(self.run_batch_duplication))
        self.btn_start_batch.pack(fill="x", pady=(10, 0))

    def browse_single_file(self):
        f = filedialog.askopenfilename(title="Select PDF File", filetypes=[("PDF Files", "*.pdf")])
        if f:
            self.single_file_var.set(f)
            dname = os.path.dirname(f)
            bname = os.path.basename(f)
            out_name = os.path.join(dname, f"Duplicated_{bname}")
            self.single_output_var.set(out_name)
            self.log(f"📄 Selected file: {bname}")

    def browse_single_output(self):
        f = filedialog.asksaveasfilename(title="Save Duplicated PDF As", defaultextension=".pdf", filetypes=[("PDF Files", "*.pdf")])
        if f:
            self.single_output_var.set(f)

    def browse_batch_folder(self):
        d = filedialog.askdirectory(title="Select Folder with PDF Files")
        if d:
            self.batch_folder_var.set(d)
            raw_files = glob.glob(os.path.join(d, "*.pdf"))
            self.batch_files_list = sorted(raw_files, key=lambda x: natural_sort_key(os.path.basename(x)))
            out_d = os.path.join(d, "Duplicated_PDFs")
            self.batch_output_var.set(out_d)
            self.log(f"📁 Selected folder with {len(self.batch_files_list)} PDF files.")

    def browse_batch_files(self):
        files = filedialog.askopenfilenames(title="Select Multiple PDF Files", filetypes=[("PDF Files", "*.pdf")])
        if files:
            self.batch_files_list = sorted(list(files), key=lambda x: natural_sort_key(os.path.basename(x)))
            p_dir = os.path.dirname(files[0])
            self.batch_folder_var.set(p_dir)
            out_d = os.path.join(p_dir, "Duplicated_PDFs")
            self.batch_output_var.set(out_d)
            self.log(f"📄 Selected {len(files)} PDF files.")

    def browse_batch_output(self):
        d = filedialog.askdirectory(title="Select Output Folder")
        if d:
            self.batch_output_var.set(d)

    def open_output_folder(self):
        target = self.last_output_dir or self.batch_output_var.get() or os.path.dirname(self.single_output_var.get() or "")
        if target and os.path.exists(target):
            os.startfile(target)
        else:
            messagebox.showwarning("Notice", "Output folder does not exist yet.")

    def log(self, text):
        self.txt_log.insert(tk.END, text + "\n")
        self.txt_log.see(tk.END)

    def set_buttons_state(self, state):
        self.btn_start_single.config(state=state)
        self.btn_start_batch.config(state=state)

    def start_thread(self, target_func):
        if self.is_running:
            return
        self.is_running = True
        self.set_buttons_state("disabled")
        threading.Thread(target=target_func, daemon=True).start()

    def run_single_duplication(self):
        try:
            in_file = self.single_file_var.get().strip()
            out_file = self.single_output_var.get().strip()
            target_p = self.target_page_var.get()
            copies = self.copies_var.get()
            pos = self.insert_pos_var.get()
            
            if not in_file or not os.path.exists(in_file):
                messagebox.showerror("Error", "Please select a valid source PDF file.")
                return
                
            if not out_file:
                out_file = os.path.join(os.path.dirname(in_file), f"Duplicated_{os.path.basename(in_file)}")
                self.single_output_var.set(out_file)
                
            self.progress_var.set(20)
            self.lbl_status.config(text="Duplicating page...")
            self.log("="*50)
            self.log(f"Processing: {os.path.basename(in_file)}")
            self.log(f"Target Page: {target_p} | Copies: {copies} | Position: {pos}")
            
            os.makedirs(os.path.dirname(out_file), exist_ok=True)
            total = duplicate_pdf_page(in_file, out_file, target_page=target_p, copies=copies, insert_pos=pos)
            
            self.last_output_dir = os.path.dirname(out_file)
            self.progress_var.set(100)
            self.lbl_status.config(text="✨ Duplication Complete!")
            self.log(f"🎉 SUCCESS! Saved {total} total pages to:\n   {out_file}")
            self.log("="*50)
            messagebox.showinfo("Success", f"Page {target_p} duplicated successfully!\n\nSaved with {total} pages at:\n{out_file}")
            
        except Exception as e:
            self.log(f"❌ Error: {e}")
            messagebox.showerror("Error", str(e))
        finally:
            self.is_running = False
            self.set_buttons_state("normal")

    def run_batch_duplication(self):
        try:
            folder = self.batch_folder_var.get().strip()
            out_dir = self.batch_output_var.get().strip()
            files = self.batch_files_list
            target_p = self.target_page_var.get()
            copies = self.copies_var.get()
            pos = self.insert_pos_var.get()
            
            if not files and folder and os.path.exists(folder):
                raw_files = glob.glob(os.path.join(folder, "*.pdf"))
                files = sorted(raw_files, key=lambda x: natural_sort_key(os.path.basename(x)))
                
            if not files:
                messagebox.showerror("Error", "Please select a folder or pick PDF files to process.")
                return
                
            if not out_dir:
                p_dir = os.path.dirname(files[0])
                out_dir = os.path.join(p_dir, "Duplicated_PDFs")
                self.batch_output_var.set(out_dir)
                
            os.makedirs(out_dir, exist_ok=True)
            self.last_output_dir = out_dir
            
            self.log("="*50)
            self.log(f"Starting batch duplication for {len(files)} files into:\n   {out_dir}")
            self.log(f"Target Page: {target_p} | Copies: {copies} | Position: {pos}")
            
            total_processed = 0
            for idx, fpath in enumerate(files, 1):
                fname = os.path.basename(fpath)
                out_path = os.path.join(out_dir, f"Duplicated_{fname}")
                
                self.lbl_status.config(text=f"Processing [{idx}/{len(files)}]: {fname}...")
                p_cnt = duplicate_pdf_page(fpath, out_path, target_page=target_p, copies=copies, insert_pos=pos)
                
                self.log(f"  [{idx}/{len(files)}] Done: {fname} -> {p_cnt} pages")
                total_processed += 1
                
                pct = int((idx / len(files)) * 100)
                self.progress_var.set(pct)
                
            self.progress_var.set(100)
            self.lbl_status.config(text="✨ Batch Duplication Complete!")
            self.log("="*50)
            self.log(f"🎉 ALL {total_processed} FILES COMPLETED! Saved in:\n   {out_dir}")
            messagebox.showinfo("Success", f"Batch duplication finished for {total_processed} PDFs!\n\nSaved in:\n{out_dir}")
            
        except Exception as e:
            self.log(f"❌ Error: {e}")
            messagebox.showerror("Error", str(e))
        finally:
            self.is_running = False
            self.set_buttons_state("normal")


if __name__ == "__main__":
    app = PDFPageDuplicatorApp()
    app.mainloop()
