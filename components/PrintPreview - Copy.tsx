
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, Printer, Type, Layout, Settings2, 
  RotateCcw, CheckCircle2, Languages,
  Shuffle, Edit3, Grid3X3, FileText, Info,
  Square, CheckSquare, Check, Columns, Globe, Trash2, Maximize, Ruler, ChevronDown,
  List, Scissors, Table as TableIcon, MoveVertical, Bold, AlignCenter, Minus, Plus,
  Droplets, Image as ImageIcon, Eye, EyeOff, Palette, Layers, FileInput,
  CreditCard, UserSquare2, Move, GripHorizontal, GripVertical, Scaling
} from 'lucide-react';
import { ExamPaper, Question, PaperSectionConfig, WatermarkType, PaperLayoutMode } from '../types';
import MathRenderer from './MathRenderer';

interface PrintPreviewProps {
  paper: ExamPaper;
  onClose: () => void;
  isEmbedded?: boolean;
  showPartHeadings?: boolean;
  showAnswers?: boolean;
}

// Compact Helper Component for Slider
const RangeControl = ({ label, value, setValue, min, max, step = 1, unit = '', width = 'w-24' }: { label: string, value: number, setValue: (v: number) => void, min: number, max: number, step?: number, unit?: string, width?: string }) => (
  <div className={`flex flex-col justify-center space-y-0.5 ${width}`}>
    <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase tracking-wider">
      <span className="truncate mr-1">{label}</span>
      <span className="text-indigo-400">{value}{unit}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step}
      value={value} 
      onChange={(e) => setValue(parseFloat(e.target.value))} 
      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 block" 
    />
  </div>
);

// Advanced Resizable Image Component
interface ImageDims { w?: number; h?: number; x: number; y: number; }

const ResizableImage = ({ 
  src, 
  alt, 
  initialDims, 
  isEditing, 
  onUpdate 
}: { 
  src: string; 
  alt?: string; 
  initialDims?: ImageDims; 
  isEditing: boolean; 
  onUpdate: (d: ImageDims) => void; 
}) => {
  const [dims, setDims] = useState<ImageDims>(initialDims || { w: undefined, h: undefined, x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Sync state if prop changes from parent
  useEffect(() => {
    if (initialDims) setDims(initialDims);
  }, [initialDims]);

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!dims.w && !dims.h) {
       const el = e.currentTarget;
       // Default constrain for print view
       const displayW = Math.min(el.naturalWidth, 300); 
       const ratio = el.naturalHeight / el.naturalWidth;
       setDims(d => ({ ...d, w: displayW, h: displayW * ratio }));
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = dims.x || 0;
    const origY = dims.y || 0;

    const onMove = (me: MouseEvent) => {
      const newX = origX + (me.clientX - startX);
      const newY = origY + (me.clientY - startY);
      setDims(d => ({ ...d, x: newX, y: newY }));
    };

    const onUp = (me: MouseEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      // Final commit
      const finalX = origX + (me.clientX - startX);
      const finalY = origY + (me.clientY - startY);
      onUpdate({ ...dims, x: finalX, y: finalY });
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleResizeStart = (e: React.MouseEvent, mode: 'W' | 'H' | 'BOTH') => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = dims.w || imgRef.current?.offsetWidth || 100;
    const startH = dims.h || imgRef.current?.offsetHeight || 100;

    const onMove = (me: MouseEvent) => {
      let newW = startW;
      let newH = startH;

      if (mode === 'W' || mode === 'BOTH') {
        newW = Math.max(20, startW + (me.clientX - startX));
      }
      if (mode === 'H' || mode === 'BOTH') {
        newH = Math.max(20, startH + (me.clientY - startY));
      }
      setDims(d => ({ ...d, w: newW, h: newH }));
    };

    const onUp = (me: MouseEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      
      let finalW = startW;
      let finalH = startH;
      if (mode === 'W' || mode === 'BOTH') finalW = Math.max(20, startW + (me.clientX - startX));
      if (mode === 'H' || mode === 'BOTH') finalH = Math.max(20, startH + (me.clientY - startY));
      
      onUpdate({ ...dims, w: finalW, h: finalH });
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div 
      className={`relative inline-block group/img select-none ${isEditing ? 'cursor-move ring-2 ring-indigo-400/30 hover:ring-indigo-500 rounded-lg' : ''}`} 
      style={{ 
        width: dims.w, 
        height: dims.h, 
        transform: `translate(${dims.x}px, ${dims.y}px)`,
        transition: isEditing ? 'none' : 'transform 0.2s',
        zIndex: isEditing ? 50 : 'auto' // Pop up when editing
      }}
      onMouseDown={handleDragStart}
    >
      <img 
        ref={imgRef}
        src={src} 
        alt={alt} 
        className="w-full h-full object-fill pointer-events-none rounded-lg" 
        onLoad={onImgLoad}
      />
      
      {isEditing && (
        <>
          {/* Move Handle (Center Overlay - Optional if clicking anywhere works) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/10 transition-opacity rounded-lg">
             <Move className="text-white drop-shadow-md" size={24} />
          </div>

          {/* Right Handle (Width Only) */}
          <div 
            className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-4 h-8 bg-white border border-indigo-300 rounded-full cursor-ew-resize flex items-center justify-center shadow-sm z-50 hover:bg-indigo-50 hover:scale-110 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, 'W')}
            title="Adjust Width"
          >
             <GripVertical size={10} className="text-indigo-500" />
          </div>

          {/* Bottom Handle (Height Only) */}
          <div 
            className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-8 h-4 bg-white border border-indigo-300 rounded-full cursor-ns-resize flex items-center justify-center shadow-sm z-50 hover:bg-indigo-50 hover:scale-110 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, 'H')}
            title="Adjust Height"
          >
             <GripHorizontal size={10} className="text-indigo-500" />
          </div>

          {/* Corner Handle (Both) */}
          <div
            className="absolute bottom-[-8px] right-[-8px] w-6 h-6 bg-indigo-600 rounded-full cursor-nwse-resize flex items-center justify-center z-50 shadow-md border-2 border-white hover:scale-110 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, 'BOTH')}
            title="Scale Both"
          >
            <Scaling size={12} className="text-white" />
          </div>
        </>
      )}
    </div>
  );
};

const PrintPreview: React.FC<PrintPreviewProps> = ({ paper, onClose, isEmbedded = false, showPartHeadings = true, showAnswers = false }) => {
  // Typography State
  const [lineHeight, setLineHeight] = useState(1.5);
  const [urduFontSize, setUrduFontSize] = useState(22);
  const [englishFontSize, setEnglishFontSize] = useState(12);
  const [schoolNameSize, setSchoolNameSize] = useState(28); 
  const [sectionHeaderSize, setSectionHeaderSize] = useState(16); 
  const [fontColor, setFontColor] = useState('#000000');
  const [fontWeight, setFontWeight] = useState<'400' | '700'>('400');
  
  // Text Size Selection Mode
  const [textSizeMode, setTextSizeMode] = useState<'English' | 'Urdu' | 'Header'>('English');

  // Expanded Font Families
  const [englishFont, setEnglishFont] = useState("'Inter', sans-serif");
  const [urduFont, setUrduFont] = useState("'Noto Nastaliq Urdu', serif");

  // Layout & Density
  const [layoutMode, setLayoutMode] = useState<PaperLayoutMode>(paper.layoutMode);
  const [isGridView, setIsGridView] = useState(false); 
  const [tableDensity, setTableDensity] = useState(8); 
  
  // Watermark State
  const [watermark, setWatermark] = useState<WatermarkType>(paper.watermark);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.1); 
  const [watermarkSize, setWatermarkSize] = useState(100); // 100%

  const [pageSize, setPageSize] = useState<'A4' | 'Legal' | 'Letter'>('A4');
  const [pagePadding, setPagePadding] = useState(10); // in mm
  
  // Student Info Style
  const [studentInfoStyle, setStudentInfoStyle] = useState<'Standard' | 'Grid'>('Standard');

  // MCQ Grid Controls
  const [mcqColumns, setMcqColumns] = useState<number>(2); 
  const [verticalSpacing, setVerticalSpacing] = useState<number>(2); 
  const [questionGap, setQuestionGap] = useState<number>(12); 
  const [bilingualInline, setBilingualInline] = useState(true);
  const [languageMode, setLanguageMode] = useState<'English' | 'Urdu' | 'Bilingual'>('Bilingual');

  // Printing Options
  const [printSyllabus, setPrintSyllabus] = useState(false);
  const [printBubbleSheet, setPrintBubbleSheet] = useState(false);
  const [printAnswerKey, setPrintAnswerKey] = useState(false);
  const [separateSubjective, setSeparateSubjective] = useState(false); // New State for Page Break

  // Interaction State
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(paper.questions);
  const [removedSections, setRemovedSections] = useState<Set<string>>(new Set());
  const [removedInfoFields, setRemovedInfoFields] = useState<Set<string>>(new Set());

  // Header Elements Visibility
  const [headerVisibility, setHeaderVisibility] = useState({
    logo: true,
    schoolName: true,
    examTitle: true,
    marksBox: true,
    sessionTag: true,
    assessmentTag: true,
    studentInfo: true,
  });

  const handlePrint = () => window.print();

  const togglePageBreak = (qId: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === qId ? { ...q, pageBreakAfter: !q.pageBreakAfter } : q
    ));
  };

  const removeQuestion = (qId: string) => {
    if (confirm("Delete this question from this print version?")) {
      setQuestions(prev => prev.filter(q => q.id !== qId));
    }
  };

  const updateQuestionImageDims = (qId: string, dims: ImageDims) => {
    setQuestions(prev => prev.map(q => 
      q.id === qId ? { ...q, imageWidth: dims.w, imageHeight: dims.h, imageX: dims.x, imageY: dims.y } as any : q
    ));
  };

  const removeSection = (sectionId: string) => {
    if (confirm("Remove this entire section from printing?")) {
      setRemovedSections(prev => {
        const next = new Set(prev);
        next.add(sectionId);
        return next;
      });
    }
  };

  const removeInfoField = (label: string) => {
    setRemovedInfoFields(prev => {
      const next = new Set(prev);
      next.add(label);
      return next;
    });
  };

  // Helper to adjust font size based on selected mode
  const adjustFontSize = (delta: number) => {
    if (textSizeMode === 'English') {
        setEnglishFontSize(prev => Math.max(8, Math.min(32, prev + delta)));
    } else if (textSizeMode === 'Urdu') {
        setUrduFontSize(prev => Math.max(12, Math.min(48, prev + delta)));
    } else if (textSizeMode === 'Header') {
        setSchoolNameSize(prev => Math.max(16, Math.min(64, prev + delta)));
    }
  };

  const activeFontSizeDisplay = useMemo(() => {
      if (textSizeMode === 'English') return englishFontSize;
      if (textSizeMode === 'Urdu') return urduFontSize;
      return schoolNameSize;
  }, [textSizeMode, englishFontSize, urduFontSize, schoolNameSize]);

  const sectionsList = useMemo(() => {
    return (Object.values(paper.structure) as PaperSectionConfig[])
      .filter(sec => !removedSections.has(sec.id))
      .sort((a, b) => {
          const aNum = parseInt(a.title.match(/\d+/)?.[0] || '0');
          const bNum = parseInt(b.title.match(/\d+/)?.[0] || '0');
          return aNum - bNum;
      });
  }, [paper.structure, removedSections]);

  const objectiveSections = useMemo(() => sectionsList.filter(s => s.category === 'Objective'), [sectionsList]);
  const subjectiveSections = useMemo(() => sectionsList.filter(s => s.category !== 'Objective'), [sectionsList]);

  const mcqsCount = questions.filter(q => q.type === 'MCQ').length;
  
  // Calculate dynamic total marks based on visible questions
  const calculatedTotalMarks = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }, [questions]);

  const pageStyles = {
    'A4': { width: '210mm', minHeight: '297mm' },
    'Legal': { width: '216mm', minHeight: '356mm' },
    'Letter': { width: '216mm', minHeight: '279mm' }
  };

  const infoFields = [
    { label: 'Student Name', value: '' }, { label: 'Roll Number', value: '' },
    { label: 'Class/Grade', value: paper.classLevel }, { label: 'Subject', value: paper.subject },
    { label: 'Time Allowed', value: `${paper.durationMinutes} Mins` }, { label: 'Exam Date', value: paper.examDate || '___/___/202__' },
    { label: 'Paper Code', value: '7012-P1' }, { label: 'Section', value: '' }, { label: 'Teacher', value: paper.createdBy }
  ].filter(f => !removedInfoFields.has(f.label));

  const fontsEnglish = [
    { name: 'Inter', val: "'Inter', sans-serif" },
    { name: 'Times New Roman', val: "'Times New Roman', serif" },
    { name: 'Garamond', val: "'EB Garamond', serif" },
    { name: 'Arial', val: "Arial, sans-serif" },
    { name: 'Courier', val: "'Courier New', monospace" },
    { name: 'Verdana', val: "Verdana, sans-serif" },
    { name: 'Poppins', val: "'Poppins', sans-serif" },
    { name: 'Playfair', val: "'Playfair Display', serif" }
  ];

  const fontsUrdu = [
    { name: 'Nastaliq', val: "'Noto Nastaliq Urdu', serif" },
    { name: 'Modern Arabic', val: "'Noto Sans Arabic', sans-serif" },
    { name: 'Amiri', val: "'Amiri', serif" },
    { name: 'Gulzar', val: "'Gulzar', serif" },
    { name: 'Ruqaa', val: "'Aref Ruqaa', serif" },
    { name: 'Lateef', val: "'Lateef', serif" }
  ];

  const cycleWatermark = () => {
    const types: WatermarkType[] = ['None', 'Monogram', 'Confidential', 'Draft'];
    const currentIdx = types.indexOf(watermark);
    const nextIdx = (currentIdx + 1) % types.length;
    setWatermark(types[nextIdx]);
  };

  return (
    <div className={isEmbedded ? "flex flex-col h-full bg-gray-100 overflow-hidden relative" : "fixed inset-0 z-[500] bg-gray-100 flex flex-col overflow-hidden print:overflow-visible print:bg-white print:static print:h-auto print:block"}>
      <style>{`
        @media print {
          @page { margin: 0; size: ${pageSize}; }
          html, body, #root, main { background: white !important; height: auto !important; overflow: visible !important; display: block !important; }
          .no-print-section { display: none !important; }
          .break-before-page { break-before: page !important; page-break-before: always !important; display: block !important; margin-top: 0 !important; border-top: none !important; }
          
          /* FIX: Hide KaTeX MathML Accessibility Layer to prevent double text */
          .katex-mathml {
            display: none !important;
            position: absolute !important;
            clip: rect(1px, 1px, 1px, 1px) !important;
            padding: 0 !important;
            border: 0 !important;
            height: 1px !important;
            width: 1px !important;
            overflow: hidden !important;
            visibility: hidden !important;
          }
          
          /* Additional protections for MathJax/KaTeX invisible layers */
          .mathml, math {
            display: none !important;
          }
          
          /* Fixed Watermark - Centered on page */
          .print-watermark-container {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: -1 !important;
            display: flex !important;
            width: 100% !important;
            height: 100% !important;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            opacity: ${watermarkOpacity} !important;
          }
          
          /* Paper container reset for print - NO SHADOW, NO BORDER */
          #exam-paper-container {
            position: relative !important;
            z-index: 1 !important;
            background-color: transparent !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: ${pagePadding}mm !important;
            box-sizing: border-box !important;
            overflow: visible !important;
            display: block !important; /* Forces block layout instead of flex */
          }
          
          /* Ensure text wraps properly */
          * {
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
        }
      `}</style>

      {/* COMPACT TOP TOOLBAR */}
      <header className="bg-[#0F172A] border-b border-slate-800 text-white shrink-0 z-50 print:hidden shadow-md flex items-center justify-between px-4 py-2 h-16">
        
        {/* Left: Branding & Exit */}
        <div className="flex items-center gap-3">
           {!isEmbedded && (
             <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
                <X size={20} />
             </button>
           )}
           <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide text-white">Print Preview</span>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">{pageSize} Mode</span>
           </div>
        </div>

        {/* Center: Scrollable Controls */}
        <div className="flex-1 flex items-center gap-4 overflow-x-auto custom-scrollbar px-4 mx-4">
           {/* ... (Existing Controls) ... */}
           {/* 1. Language & Layout */}
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700 shrink-0">
              <select value={languageMode} onChange={e => setLanguageMode(e.target.value as any)} className="bg-transparent text-[10px] font-bold text-white outline-none w-20">
                 <option value="Bilingual">Bilingual</option>
                 <option value="English">English</option>
                 <option value="Urdu">Urdu</option>
              </select>
              <div className="w-px h-4 bg-slate-700"></div>
              <button onClick={() => setIsGridView(!isGridView)} className={`p-1.5 rounded ${isGridView ? 'bg-indigo-600 text-white' : 'text-slate-400'}`} title="Grid Mode">
                 <TableIcon size={14} />
              </button>
              <select value={pageSize} onChange={e => setPageSize(e.target.value as any)} className="bg-transparent text-[10px] font-bold text-white outline-none w-16">
                 <option value="A4">A4</option>
                 <option value="Legal">Legal</option>
                 <option value="Letter">Letter</option>
              </select>
           </div>

           {/* 2. Enhanced Font Size Controls */}
           <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700 shrink-0">
              <div className="flex flex-col space-y-1">
                 <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Select Text</span>
                 <select 
                    value={textSizeMode} 
                    onChange={e => setTextSizeMode(e.target.value as any)} 
                    className="bg-transparent text-[9px] font-bold text-white outline-none w-20 border-b border-slate-600 pb-0.5"
                 >
                    <option value="English">English</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Header">Header</option>
                 </select>
              </div>
              <div className="flex items-center gap-1">
                 <button onClick={() => adjustFontSize(-1)} className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 text-white"><Minus size={12} /></button>
                 <span className="w-8 text-center text-[10px] font-bold text-indigo-300">{activeFontSizeDisplay}px</span>
                 <button onClick={() => adjustFontSize(1)} className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 text-white"><Plus size={12} /></button>
              </div>
           </div>

           {/* 3. Spacing */}
           <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700 shrink-0">
              <RangeControl label="Gap" value={questionGap} setValue={setQuestionGap} min={0} max={40} width="w-12" />
              <RangeControl label="Margin" value={pagePadding} setValue={setPagePadding} min={0} max={40} unit="mm" width="w-14" />
              {!isGridView && <RangeControl label="MCQ Cols" value={mcqColumns} setValue={setMcqColumns} min={1} max={4} width="w-12" />}
           </div>

           {/* 4. Visibility & Watermark */}
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700 shrink-0">
              <button onClick={() => setHeaderVisibility(v => ({...v, logo: !v.logo}))} className={`p-1.5 rounded border ${headerVisibility.logo ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-300' : 'bg-transparent border-slate-700 text-slate-500'}`} title="Logo">
                 <ImageIcon size={14} />
              </button>
              <button onClick={() => setHeaderVisibility(v => ({...v, marksBox: !v.marksBox}))} className={`p-1.5 rounded border ${headerVisibility.marksBox ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-300' : 'bg-transparent border-slate-700 text-slate-500'}`} title="Marks Box">
                 <Square size={14} />
              </button>
              <div className="w-px h-4 bg-slate-700"></div>
              <button onClick={cycleWatermark} className={`p-1.5 rounded border ${watermark !== 'None' ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-300' : 'bg-transparent border-slate-700 text-slate-500'}`} title={`Watermark: ${watermark}`}>
                 <Globe size={14} />
              </button>
              {watermark !== 'None' && (
                 <>
                    <RangeControl label="Opacity" value={watermarkOpacity} setValue={setWatermarkOpacity} min={0.05} max={1.0} step={0.05} width="w-14" />
                    <RangeControl label="Size" value={watermarkSize} setValue={setWatermarkSize} min={20} max={200} step={10} width="w-14" />
                 </>
              )}
           </div>

           {/* 5. Extras */}
           <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setStudentInfoStyle(prev => prev === 'Standard' ? 'Grid' : 'Standard')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase whitespace-nowrap transition-all ${studentInfoStyle === 'Grid' ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-400' : 'bg-transparent border-slate-700 text-slate-400'}`} title="Student Grid Header">
                 <UserSquare2 size={12} /> Header Grid
              </button>
              <button onClick={() => setPrintBubbleSheet(!printBubbleSheet)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase whitespace-nowrap transition-all ${printBubbleSheet ? 'bg-emerald-600/20 border-emerald-600/50 text-emerald-400' : 'bg-transparent border-slate-700 text-slate-400'}`}>
                 <Grid3X3 size={12} /> OMR
              </button>
              <button onClick={() => setPrintAnswerKey(!printAnswerKey)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase whitespace-nowrap transition-all ${printAnswerKey ? 'bg-emerald-600/20 border-emerald-600/50 text-emerald-400' : 'bg-transparent border-slate-700 text-slate-400'}`}>
                 <CheckSquare size={12} /> Key
              </button>
              <button 
                onClick={() => setSeparateSubjective(!separateSubjective)} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase whitespace-nowrap transition-all ${separateSubjective ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-400' : 'bg-transparent border-slate-700 text-slate-400'}`}
                title="Print Subjective Part on Separate Page"
              >
                 <Layers size={12} /> Split
              </button>
           </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
           <button onClick={() => setIsManualEdit(!isManualEdit)} className={`p-2 rounded-lg transition-colors ${isManualEdit ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Edit Mode">
              <Edit3 size={18} />
           </button>
           <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-900/50 transition-all active:scale-95">
              <Printer size={16} /> Print PDF
           </button>
        </div>
      </header>

      {/* PAPER CANVAS */}
      <main className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center custom-scrollbar scroll-smooth print:p-0 print:overflow-visible print:h-auto print:block relative">
         
         <div 
           id="exam-paper-container"
           style={{ 
             fontSize: `${englishFontSize}px`, 
             lineHeight: lineHeight,
             color: fontColor,
             fontWeight: fontWeight,
             fontFamily: englishFont,
             width: pageStyles[pageSize].width,
             padding: `${pagePadding}mm`
           }}
           className={`bg-white relative transition-all origin-top min-h-[297mm] mx-auto print:min-h-0 print:h-auto print:w-full print:mx-0 print:bg-white ${isManualEdit ? 'ring-1 ring-amber-500 ring-dashed' : ''}`}
         >
            {/* Urdu Font Injection */}
            <style>{`
                .font-urdu { font-family: ${urduFont} !important; }
            `}</style>

            {/* Watermark Layer */}
            {watermark !== 'None' && (
                <div 
                   className="print-watermark-container absolute inset-0 pointer-events-none flex items-center justify-center z-0 select-none overflow-hidden print:fixed"
                   style={{ opacity: watermarkOpacity }}
                >
                   <div style={{ transform: `scale(${watermarkSize / 100}) rotate(-45deg)`, transformOrigin: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {watermark === 'Monogram' ? (
                          <img src={paper.headerConfig.logoUrl} className="w-[120mm]" style={{ transform: 'rotate(45deg)' }} />
                       ) : (
                          watermark === 'Confidential' ? (
                             <h1 className="font-black text-slate-300 whitespace-nowrap text-[8vw] leading-none text-center">
                               {paper.headerConfig.schoolName || 'SCHOOL NAME'}
                             </h1>
                          ) : (
                             <h1 className="font-black text-slate-200 text-[10vw] border-[20px] border-slate-200 p-10 leading-none">
                               DRAFT
                             </h1>
                          )
                       )}
                   </div>
                </div>
            )}

            <div className="relative z-10 flex flex-col min-h-full print:block print:h-auto content-layer">
               {/* HEADER SECTION (unchanged) */}
               <header className="pb-4 mb-4" style={{ fontWeight: 700 }}>
                  <div className="flex justify-between items-center gap-8 mb-6">
                     {headerVisibility.logo && (
                        <div className="relative group shrink-0">
                          {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({...v, logo: false}))} className="absolute -top-3 -left-3 p-1.5 bg-red-500 text-white rounded-full z-20 shadow-lg print:hidden hover:bg-red-600 transition-colors"><Trash2 size={12}/></button>}
                          <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
                              <img src={paper.headerConfig.logoUrl} className="w-full h-full object-contain" />
                          </div>
                        </div>
                     )}
                     <div className="flex-1 text-center">
                        {headerVisibility.schoolName && (
                          <div className="relative group inline-block mx-auto">
                            {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({...v, schoolName: false}))} className="absolute -top-4 -left-8 p-1.5 bg-red-500 text-white rounded-full z-20 shadow-lg print:hidden opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"><Trash2 size={12}/></button>}
                            <h1 style={{ fontSize: `${schoolNameSize}px` }} contentEditable={isManualEdit} className={`font-black text-slate-900 uppercase tracking-tighter leading-[1] mb-1 outline-none ${isManualEdit ? 'bg-amber-50 rounded p-1 border-dashed border border-amber-300' : ''}`}>
                               {paper.headerConfig.schoolName}
                            </h1>
                          </div>
                        )}
                        
                        <div className="relative group">
                          {headerVisibility.examTitle && (
                            <>
                                {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({...v, examTitle: false}))} className="absolute -top-2 -left-6 p-1 bg-red-500 text-white rounded-full z-20 shadow-lg print:hidden opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"><Trash2 size={10}/></button>}
                                <h2 contentEditable={isManualEdit} className={`text-xl font-bold text-slate-700 uppercase tracking-[0.2em] outline-none ${isManualEdit ? 'bg-amber-50 rounded p-1 border-dashed border border-amber-300' : ''}`}>
                                   {paper.headerConfig.examTitle}
                                </h2>
                            </>
                          )}
                        </div>

                        <div className="flex justify-center gap-3 mt-3">
                           {headerVisibility.sessionTag && (
                              <div className="relative group">
                                 {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({...v, sessionTag: false}))} className="absolute -top-3 -left-4 p-0.5 bg-red-500 text-white rounded-full z-20 print:hidden opacity-0 group-hover:opacity-100"><Trash2 size={8}/></button>}
                                 <span contentEditable={isManualEdit} className="text-[10px] font-black uppercase bg-black text-white px-3 py-1 rounded outline-none">SESSION 2024-2025</span>
                              </div>
                           )}
                           {headerVisibility.assessmentTag && (
                              <div className="relative group">
                                 {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({...v, assessmentTag: false}))} className="absolute -top-3 -left-4 p-0.5 bg-red-500 text-white rounded-full z-20 print:hidden opacity-0 group-hover:opacity-100"><Trash2 size={8}/></button>}
                                 <span contentEditable={isManualEdit} className="text-[10px] font-black uppercase border-2 border-black px-3 py-1 rounded outline-none">INTERNAL ASSESSMENT</span>
                              </div>
                           )}
                        </div>
                     </div>
                     {headerVisibility.marksBox && (
                        <div className="w-20 h-20 border-2 border-black flex flex-col items-center justify-center shrink-0 rounded-lg relative group">
                          {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({...v, marksBox: false}))} className="absolute -top-3 -right-3 p-1 bg-red-500 text-white rounded-full z-20 print:hidden opacity-0 group-hover:opacity-100"><Trash2 size={10}/></button>}
                          <span className="text-[7px] font-black uppercase text-slate-500 tracking-widest">Total Marks</span>
                          <span contentEditable={isManualEdit} className="text-3xl font-black outline-none">{calculatedTotalMarks}</span>
                        </div>
                     )}
                  </div>

                  {headerVisibility.studentInfo && (
                    <div className="relative group pt-4">
                       {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({...v, studentInfo: false}))} className="absolute -left-6 top-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden hover:scale-110"><Trash2 size={16}/></button>}
                       
                       {studentInfoStyle === 'Grid' ? (
                          /* GRID STYLE HEADER */
                          <div className="border-2 border-black">
                             <div className="grid grid-cols-4 divide-x-2 divide-black border-b-2 border-black">
                                <div className="p-2">
                                   <span className="block text-[8px] font-black uppercase text-slate-500 mb-1">Student Name</span>
                                   <div className="h-4"></div>
                                </div>
                                <div className="p-2">
                                   <span className="block text-[8px] font-black uppercase text-slate-500 mb-1">Roll Number</span>
                                   <div className="h-4"></div>
                                </div>
                                <div className="p-2">
                                   <span className="block text-[8px] font-black uppercase text-slate-500 mb-1">Section</span>
                                   <div className="h-4"></div>
                                </div>
                                <div className="p-2">
                                   <span className="block text-[8px] font-black uppercase text-slate-500 mb-1">Date</span>
                                   <div className="text-[10px] font-bold">{paper.examDate || '___/___/20__'}</div>
                                </div>
                             </div>
                             <div className="grid grid-cols-4 divide-x-2 divide-black">
                                <div className="p-2 col-span-2">
                                   <span className="block text-[8px] font-black uppercase text-slate-500 mb-1">Subject / Paper</span>
                                   <div className="text-[10px] font-bold">{paper.subject} ({paper.classLevel})</div>
                                </div>
                                <div className="p-2">
                                   <span className="block text-[8px] font-black uppercase text-slate-500 mb-1">Time Allowed</span>
                                   <div className="text-[10px] font-bold">{paper.durationMinutes} Mins</div>
                                </div>
                                <div className="p-2">
                                   <span className="block text-[8px] font-black uppercase text-slate-500 mb-1">Invigilator Sign</span>
                                   <div className="h-4"></div>
                                </div>
                             </div>
                          </div>
                       ) : (
                          /* STANDARD LIST HEADER */
                          <div className="grid grid-cols-3 gap-y-3 gap-x-8 border-t border-slate-200 pt-4 relative">
                             {infoFields.map((field, i) => (
                                <div key={i} className="flex items-baseline border-b border-dotted border-slate-300 pb-1 relative group/field">
                                   {isManualEdit && <button onClick={() => removeInfoField(field.label)} className="absolute -left-4 top-0 text-red-500 opacity-0 group-hover/field:opacity-100 transition-opacity print:hidden hover:scale-110"><X size={10}/></button>}
                                   <span className="text-[9px] font-black uppercase text-slate-500 w-24 shrink-0">{field.label}:</span>
                                   <span contentEditable={isManualEdit} className="text-[11px] font-bold text-black flex-1 truncate outline-none min-h-[1.2em]">{field.value}</span>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                  )}
               </header>

               {/* REVISED BUBBLE SHEET: COLUMN WISE COUNTING */}
               {printBubbleSheet && objectiveSections.length > 0 && (
                  <div className="mb-8 p-4 border border-black rounded-lg bg-transparent break-inside-avoid relative overflow-hidden">
                     <div className="flex justify-between items-center mb-4 border-b border-black pb-2">
                        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                           <Grid3X3 size={12} className="text-black" /> OMR Answer Sheet
                        </h4>
                        <div className="flex gap-3">
                           <div className="flex items-center gap-1.5 text-[7px] font-bold uppercase"><div className="w-2.5 h-2.5 rounded-full border border-black"></div> Unfilled</div>
                           <div className="flex items-center gap-1.5 text-[7px] font-bold uppercase"><div className="w-2.5 h-2.5 rounded-full bg-black"></div> Correct</div>
                        </div>
                     </div>
                     
                     <div className="columns-3 md:columns-4 gap-8 space-y-1">
                        {questions.filter(q => q.type === 'MCQ').map((q, idx) => {
                           const optionCount = q.options ? q.options.length : 4;
                           const bubbles = Array.from({length: optionCount}, (_, i) => String.fromCharCode(65 + i));
                           
                           return (
                             <div key={idx} className="break-inside-avoid flex items-center gap-2 border-b border-dotted border-slate-300 pb-0.5 pr-2 mb-1">
                                <span className="text-[9px] font-black text-slate-900 w-5 text-right">{idx+1}.</span>
                                <div className="flex gap-1.5">
                                   {bubbles.map(char => (
                                      <div key={char} className="w-4 h-4 rounded-full border border-black flex items-center justify-center text-[6px] font-black text-slate-600">
                                         {char}
                                      </div>
                                   ))}
                                </div>
                             </div>
                           );
                        })}
                     </div>
                  </div>
               )}

               {/* PART I: OBJECTIVE */}
               {objectiveSections.length > 0 && (
                  <div className="mb-8">
                     {showPartHeadings && (
                         <div className="text-center mb-6 pb-2 border-b-2 border-black">
                            <h2 className="text-lg font-black uppercase tracking-widest">Part I: Objective</h2>
                         </div>
                     )}
                     <div className={`flex-1 ${layoutMode === 'DoubleColumn' && !isGridView ? 'columns-2 gap-8' : 'space-y-6'}`}>
                        {objectiveSections.map((sec) => {
                           const secQuestions = questions.filter(q => q.sectionId === sec.id);
                           if (secQuestions.length === 0) return null;
                           return renderSection(sec, secQuestions);
                        })}
                     </div>
                  </div>
               )}

               {/* PART II: SUBJECTIVE (With explicit page break logic) */}
               {subjectiveSections.length > 0 && (
                  <div 
                    className={`pt-4 ${separateSubjective ? 'break-before-page' : 'mt-4 border-t-2 border-dashed border-slate-300'}`}
                    style={separateSubjective ? { pageBreakBefore: 'always' } : {}}
                  >
                     {showPartHeadings && (
                         <div className="text-center mb-6 pb-2 border-b-2 border-black">
                            <h2 className="text-lg font-black uppercase tracking-widest">Part II: Subjective</h2>
                         </div>
                     )}
                     <div className={`flex-1 ${layoutMode === 'DoubleColumn' && !isGridView ? 'columns-2 gap-8' : 'space-y-6'}`}>
                        {subjectiveSections.map((sec) => {
                           const secQuestions = questions.filter(q => q.sectionId === sec.id);
                           if (secQuestions.length === 0) return null;
                           return renderSection(sec, secQuestions);
                        })}
                     </div>
                  </div>
               )}

               {/* TEACHER COPY ANSWER KEY */}
               {printAnswerKey && mcqsCount > 0 && (
                  <div className="mt-8 p-6 border-t-[3px] border-black bg-slate-50/50 break-inside-avoid rounded-2xl">
                     <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-black">
                        <CheckCircle2 size={14} /> Official Answer Reference Key
                     </h4>
                     <div className="grid grid-cols-10 gap-2">
                        {questions.filter(q => q.type === 'MCQ').map((q, idx) => (
                           <div key={idx} className="flex flex-col border border-slate-200 bg-white p-1.5 rounded-lg text-center shadow-sm">
                              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Q.{idx+1}</span>
                              <span className="text-sm font-black text-indigo-700 leading-none mt-1">
                                <MathRenderer text={q.correctAnswer || 'N/A'} inline />
                              </span>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>
         </div>
      </main>
    </div>
  );

  function renderSection(sec: PaperSectionConfig, secQuestions: Question[]) {
      return (
        <section key={sec.id} className="relative print:break-inside-auto mb-4" style={{ marginBottom: `${questionGap}px` }}>
           {showPartHeadings && (
              <div className="flex justify-between items-baseline border-b border-black mb-4 pb-1 relative group break-inside-avoid">
                 {isManualEdit && <button onClick={() => removeSection(sec.id)} className="absolute -left-8 top-1 p-1 bg-red-500 text-white rounded-md z-20 shadow-lg print:hidden opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"><Trash2 size={12}/></button>}
                 <h3 style={{ fontSize: `${sectionHeaderSize}px`, fontWeight: 900 }} contentEditable={isManualEdit} className="uppercase tracking-tighter outline-none">
                    {sec.title}
                 </h3>
                 <div className="flex gap-4 items-baseline shrink-0">
                    <span className="text-[10px] font-black text-indigo-600 uppercase italic">Attempt {sec.selectCount}</span>
                 </div>
              </div>
           )}

           {isGridView ? (
             /* TABLE GRID MODE */
             <table className="w-full border-collapse border-2 border-black text-left">
               <thead className="bg-slate-100 border-b-2 border-black">
                  <tr className="font-black text-[10px] uppercase tracking-widest">
                     <th className="border-r-2 border-black p-2 w-10 text-center">SR.</th>
                     <th className="p-2">ITEM DESCRIPTION / CONTENT</th>
                  </tr>
               </thead>
               <tbody className="divide-y-2 divide-black">
                  {secQuestions.map((q, idx) => (
                     <tr key={q.id} className="break-inside-avoid relative group/row">
                        <td style={{ padding: `${tableDensity}px` }} className="border-r-2 border-black align-top text-center font-black">
                           {sec.subQuestionNumbering === 'Roman' ? `${["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"][idx] || idx + 1}` : `${idx+1}`}
                           {isManualEdit && (
                              <button onClick={() => removeQuestion(q.id)} className="absolute -left-10 top-2 p-1 text-red-500 hover:bg-red-50 rounded print:hidden opacity-0 group-row:opacity-100"><Trash2 size={14}/></button>
                           )}
                        </td>
                        <td style={{ padding: `${tableDensity}px` }} className="p-2 align-top">
                           <div className="space-y-2">
                             {(languageMode === 'Bilingual' || languageMode === 'English') && q.text && (
                                isManualEdit ? 
                                <p contentEditable className="font-bold leading-relaxed outline-none">{q.text}</p> :
                                <MathRenderer text={q.text} className="font-bold leading-relaxed" />
                             )}
                             {(languageMode === 'Bilingual' || languageMode === 'Urdu') && q.textUrdu && (
                                <div dir="rtl" style={{ fontSize: `${urduFontSize}px` }} className="font-urdu text-right leading-[1.8] py-1">
                                    {isManualEdit ? 
                                        <p contentEditable className="outline-none">{q.textUrdu}</p> : 
                                        <MathRenderer text={q.textUrdu} />
                                    }
                                </div>
                             )}
                             {q.imageUrl && (
                                <div className="py-2 flex justify-center">
                                    <ResizableImage 
                                        src={q.imageUrl} 
                                        alt="Diagram"
                                        initialDims={{ 
                                            w: (q as any).imageWidth, 
                                            h: (q as any).imageHeight,
                                            x: (q as any).imageX || 0,
                                            y: (q as any).imageY || 0
                                        }}
                                        isEditing={isManualEdit}
                                        onUpdate={(d) => updateQuestionImageDims(q.id, d)}
                                    />
                                </div>
                             )}
                             {q.type === 'MCQ' && q.options && (
                                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 mt-1">
                                   {q.options.map((opt, i) => (
                                     <div key={i} className="flex gap-1 items-baseline">
                                        <span className="text-[10px] font-black text-slate-400">({String.fromCharCode(65+i)})</span>
                                        {isManualEdit ? 
                                            <span contentEditable className="text-[11px] font-medium outline-none truncate">{opt}</span> :
                                            <MathRenderer text={opt} className={`text-[11px] font-medium truncate ${showAnswers && opt === q.correctAnswer ? 'font-bold underline text-green-700 decoration-green-500' : ''}`} inline />
                                        }
                                     </div>
                                   ))}
                                </div>
                             )}
                             {/* Show Answers Logic for Grid View */}
                             {showAnswers && q.type !== 'MCQ' && (
                                 <div className="mt-2 text-sm text-green-700 bg-green-50 p-1 rounded border border-green-200 font-medium">
                                     <span className="font-bold">Ans:</span> <MathRenderer text={q.correctAnswer || 'N/A'} inline />
                                 </div>
                             )}
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
             </table>
           ) : (
             /* STANDARD LIST MODE */
             <div className={`space-y-4 ${sec.questionsPerLine ? 'grid grid-cols-2 gap-x-8 gap-y-4 space-y-0' : ''}`} style={{ rowGap: `${questionGap}px` }}>
                {secQuestions.map((q, idx) => (
                   <div key={q.id} className="relative break-inside-avoid group/q" style={{ marginBottom: `${questionGap}px` }}>
                      {isManualEdit && (
                         <div className="absolute -left-12 top-0 flex flex-col gap-1 print:hidden">
                            <button onClick={() => togglePageBreak(q.id)} className={`p-1.5 rounded transition-colors shadow-sm ${q.pageBreakAfter ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><Scissors size={14}/></button>
                            <button onClick={() => removeQuestion(q.id)} className="p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors shadow-sm"><Trash2 size={14}/></button>
                         </div>
                      )}
                      <div className="flex gap-3 items-start relative">
                         <span className="font-black text-sm min-w-[20px] pt-0.5 text-slate-900">
                            {sec.subQuestionNumbering === 'Roman' ? `${["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"][idx] || idx + 1}.` : `${idx+1}.`}
                         </span>
                         <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start w-full relative">
                               {(languageMode === 'Bilingual' || languageMode === 'English') && q.text && (
                                  isManualEdit ?
                                  <p contentEditable className={`leading-relaxed outline-none flex-1 pr-12 bg-amber-50 rounded border-dashed border border-amber-300 p-1`}>{q.text}</p> :
                                  <MathRenderer text={q.text} className="leading-relaxed flex-1 pr-10" />
                               )}
                               <span contentEditable={isManualEdit} className="text-[10px] font-black text-slate-500 pt-0.5 shrink-0 absolute right-0 top-0">[{q.marks}]</span>
                            </div>
                            
                            {(languageMode === 'Bilingual' || languageMode === 'Urdu') && q.textUrdu && (
                               <div dir="rtl" style={{ fontSize: `${urduFontSize}px` }} className={`font-urdu text-right text-black leading-[1.8] py-1`}>
                                  {isManualEdit ? 
                                    <p contentEditable className="bg-amber-50 rounded border-dashed border border-amber-300 p-2 outline-none">{q.textUrdu}</p> :
                                    <MathRenderer text={q.textUrdu} />
                                  }
                               </div>
                            )}

                            {q.imageUrl && (
                                <div className="my-3 flex justify-center">
                                    <ResizableImage 
                                        src={q.imageUrl} 
                                        alt="Diagram"
                                        initialDims={{ 
                                            w: (q as any).imageWidth, 
                                            h: (q as any).imageHeight,
                                            x: (q as any).imageX || 0,
                                            y: (q as any).imageY || 0
                                        }}
                                        isEditing={isManualEdit}
                                        onUpdate={(d) => updateQuestionImageDims(q.id, d)}
                                    />
                                </div>
                            )}

                            {/* SHOW ANSWER LOGIC FOR LIST VIEW */}
                            {showAnswers && (
                                <div className="mt-1 mb-2 font-bold text-sm text-green-700 flex flex-col items-start gap-1 p-1 bg-green-50/50 rounded border border-transparent">
                                    <span className="text-[10px] uppercase tracking-wider text-green-600">Answer:</span>
                                    {(languageMode === 'Bilingual' || languageMode === 'English') && q.correctAnswer && (
                                        <MathRenderer text={q.correctAnswer} inline />
                                    )}
                                    {(languageMode === 'Bilingual' || languageMode === 'Urdu') && q.correctAnswerUrdu && (
                                        <div className="font-urdu text-right w-full" dir="rtl">
                                            <MathRenderer text={q.correctAnswerUrdu} inline />
                                        </div>
                                    )}
                                </div>
                            )}

                            {q.type === 'MCQ' && q.options && (
                               <div 
                                 className={`grid gap-x-4 mt-2 break-inside-avoid transition-all`}
                                 style={{ 
                                   gridTemplateColumns: `repeat(${mcqColumns}, minmax(0, 1fr))`,
                                   rowGap: `${verticalSpacing * 2}px` 
                                 }}
                               >
                                  {q.options.map((opt, i) => {
                                     // Highlight if showing answers
                                     const isCorrect = showAnswers && opt === q.correctAnswer;
                                     return (
                                         <div key={i} className={`flex items-start gap-2 relative ${isCorrect ? 'bg-green-100/50 rounded p-1 -m-1 border border-green-200' : ''}`}>
                                            <span className={`text-[10px] font-black uppercase shrink-0 pt-0.5 ${isCorrect ? 'text-green-700' : 'text-slate-400'}`}>({String.fromCharCode(65+i)})</span>
                                            <div className={`flex-1 flex ${bilingualInline ? 'flex-row items-baseline gap-2' : 'flex-col gap-0.5'}`}>
                                               {(languageMode === 'Bilingual' || languageMode === 'English') && (
                                                  isManualEdit ?
                                                  <span contentEditable className="text-[12px] font-medium text-slate-800 outline-none">{opt}</span> :
                                                  <MathRenderer text={opt} className={`text-[12px] font-medium ${isCorrect ? 'text-green-900 font-bold' : 'text-slate-800'}`} />
                                               )}
                                               {(languageMode === 'Bilingual' || languageMode === 'Urdu') && q.optionsUrdu?.[i] && (
                                                  <div dir="rtl" className={`font-urdu text-right ${isCorrect ? 'text-green-900 font-bold' : 'text-black'} ${bilingualInline ? 'text-[1.2em] leading-none' : 'text-[1.3em] mt-0.5'}`}>
                                                    {isManualEdit ? 
                                                        <span contentEditable className="outline-none">{q.optionsUrdu[i]}</span> :
                                                        <MathRenderer text={q.optionsUrdu[i]} />
                                                    }
                                                  </div>
                                               )}
                                            </div>
                                            {isCorrect && <CheckCircle2 size={12} className="text-green-600 absolute -right-2 top-0" />}
                                         </div>
                                     );
                                  })}
                               </div>
                            )}

                            {q.type === 'Match Columns' && q.matchingPairs && (
                               <div className="mt-6 mx-1 md:mx-4 break-inside-avoid">
                                  {/* Changed to Grid with Gap for separation */}
                                  <div className="grid grid-cols-2 gap-16">
                                     {/* Column A */}
                                     <div className="border-2 border-black rounded-lg overflow-hidden">
                                        <div className="bg-slate-100 border-b-2 border-black p-2 text-center">
                                            <h4 className="font-black text-xs uppercase tracking-widest">Column A</h4>
                                        </div>
                                        <div className="divide-y-2 divide-black bg-white">
                                           {q.matchingPairs.map((pair, i) => (
                                              <div key={`left-${i}`} className="p-3 flex gap-3 items-center min-h-[40px]">
                                                 <span className="font-bold text-xs w-5 shrink-0">({i+1})</span>
                                                 <div className={`flex-1 flex ${bilingualInline ? 'flex-col gap-1' : 'flex-col'}`}>
                                                    {(languageMode === 'Bilingual' || languageMode === 'English') && 
                                                        (isManualEdit ? <span contentEditable className="text-xs font-bold leading-tight outline-none">{pair.left}</span> : <MathRenderer text={pair.left} className="text-xs font-bold leading-tight" />)
                                                    }
                                                    {(languageMode === 'Bilingual' || languageMode === 'Urdu') && pair.leftUrdu && 
                                                        <div className="font-urdu text-right mt-1 leading-tight text-sm" dir="rtl">
                                                            {isManualEdit ? <span contentEditable className="outline-none">{pair.leftUrdu}</span> : <MathRenderer text={pair.leftUrdu} />}
                                                        </div>
                                                    }
                                                 </div>
                                              </div>
                                           ))}
                                        </div>
                                     </div>
                                     {/* Column B - Shuffled Display for Exam */}
                                     <div className="border-2 border-black rounded-lg overflow-hidden">
                                        <div className="bg-slate-100 border-b-2 border-black p-2 text-center">
                                            <h4 className="font-black text-xs uppercase tracking-widest">Column B</h4>
                                        </div>
                                        <div className="divide-y-2 divide-black bg-white">
                                           {[...q.matchingPairs]
                                              .sort((a, b) => (showAnswers ? 0 : (a.right || '').localeCompare(b.right || ''))) // If showing answers, don't shuffle (or show matched)
                                              .map((pair, i) => (
                                              <div key={`right-${i}`} className={`p-3 flex gap-3 items-center min-h-[40px] ${showAnswers ? 'bg-green-50' : ''}`}>
                                                 <span className="font-bold text-xs w-5 shrink-0">({String.fromCharCode(65+i)})</span>
                                                 <div className={`flex-1 flex ${bilingualInline ? 'flex-col gap-1' : 'flex-col'}`}>
                                                    {(languageMode === 'Bilingual' || languageMode === 'English') && 
                                                        (isManualEdit ? <span contentEditable className="text-xs font-bold leading-tight outline-none">{pair.right}</span> : <MathRenderer text={pair.right} className="text-xs font-bold leading-tight" />)
                                                    }
                                                    {(languageMode === 'Bilingual' || languageMode === 'Urdu') && pair.rightUrdu && 
                                                        <div className="font-urdu text-right mt-1 leading-tight text-sm" dir="rtl">
                                                            {isManualEdit ? <span contentEditable className="outline-none">{pair.rightUrdu}</span> : <MathRenderer text={pair.rightUrdu} />}
                                                        </div>
                                                    }
                                                 </div>
                                                 {showAnswers && <span className="text-[9px] font-bold text-green-600 border border-green-300 px-1 rounded">Matches ({i+1})</span>}
                                              </div>
                                           ))}
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            )}
                         </div>
                      </div>
                      
                      {q.pageBreakAfter && (
                         <div className="page-break relative print:hidden h-8 flex items-center justify-center">
                            <div className="w-full border-t-2 border-dashed border-indigo-400 opacity-50"></div>
                            <div className="absolute bg-indigo-600 text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
                               <Scissors size={10} /> Manual Page Break
                            </div>
                         </div>
                      )}
                   </div>
                ))}
             </div>
           )}
        </section>
      );
  }
};

export default PrintPreview;
