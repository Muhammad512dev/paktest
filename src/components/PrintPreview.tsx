
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X, Printer, Type, Layout, Settings2,
  RotateCcw, CheckCircle2, Languages,
  Shuffle, Edit3, Grid3X3, FileText, Info,
  Square, CheckSquare, Check, Columns, Globe, Trash2, Maximize, Ruler, ChevronDown, ChevronUp,
  List, Scissors, Table as TableIcon, MoveVertical, Bold, AlignCenter, Minus, Plus,
  Droplets, Image as ImageIcon, Eye, EyeOff, Palette, Layers, FileInput,
  CreditCard, UserSquare2, Move, GripHorizontal, GripVertical, Scaling, Hash
} from 'lucide-react';
import { ExamPaper, Question, PaperSectionConfig, WatermarkType, PaperLayoutMode, getDefaultSectionInstruction, getDefaultSectionInstructionUrdu } from '../types';
import MathRenderer from './MathRenderer';

const ROMAN_NUMS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv'];

interface PrintPreviewProps {
  paper: ExamPaper;
  onClose: () => void;
  isEmbedded?: boolean;
  showPartHeadings?: boolean;
  answerKeyDisplay?: 'none' | 'inline' | 'bottom';
  onShowQuestionMarksChange?: (show: boolean) => void;
}

// Compact Helper Component for Slider
const RangeControl = ({ label, value, setValue, min, max, step = 1, unit = '', width = 'w-24' }: { label: string, value: number, setValue: (v: number) => void, min: number, max: number, step?: number, unit?: string, width?: string }) => (
  <div className={`flex flex-col justify-center space-y-1 ${width}`}>
    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 block"
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

const PrintPreview: React.FC<PrintPreviewProps> = ({ paper, onClose, isEmbedded = false, showPartHeadings = true, answerKeyDisplay = 'none', onShowQuestionMarksChange }) => {
  const isMCQType = (type: string | undefined) => {
    const t = (type || '').toLowerCase().trim();
    return t === 'mcq' || t.includes('mcq') || t.includes('multiple choice') || t.includes('multi choice');
  };

  const getMcqOptions = (q: any): string[] => {
    const english = Array.isArray(q?.options) ? q.options : [];
    if (english.length > 0) return english;
    const urdu = Array.isArray(q?.optionsUrdu) ? q.optionsUrdu : [];
    return urdu;
  };

  // Typography State
  const [lineHeight, setLineHeight] = useState(1.5);
  const [urduFontSize, setUrduFontSize] = useState(14);
  const [englishFontSize, setEnglishFontSize] = useState(14);
  const [schoolNameSize, setSchoolNameSize] = useState(28);
  const [sectionHeaderSize, setSectionHeaderSize] = useState(16);
  const [fontColor, setFontColor] = useState('#000000');
  const [fontWeight, setFontWeight] = useState<'400' | '700'>('400');
  const [boldAllText, setBoldAllText] = useState(false);
  const [objectiveBold, setObjectiveBold] = useState(false);

  // Text Size Selection Mode
  const [textSizeMode, setTextSizeMode] = useState<'English' | 'Urdu' | 'Header' | 'OptionLabel' | 'OptionEn' | 'OptionUr'>('English');
  const [optionLabelSize, setOptionLabelSize] = useState(9);
  const [optionTextSize, setOptionTextSize] = useState(9);
  const [optionUrduSize, setOptionUrduSize] = useState(12);

  // Expanded Font Families
  const [englishFont, setEnglishFont] = useState("'Times New Roman', serif");
  const [urduFont, setUrduFont] = useState("'Noto Nastaliq Urdu', serif");

  // Heading borders apply consistently to standard and board-format headings.
  const [headingBorderMode, setHeadingBorderMode] = useState<'subjective' | 'all' | 'none'>('subjective');
  const headingHasBorder = (category?: string) =>
    headingBorderMode === 'all' || (headingBorderMode === 'subjective' && category !== 'Objective');
  const headingBorderClass = (category?: string) =>
    headingHasBorder(category) ? 'border-b-2 border-black' : 'border-b-0';

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
  const [canvasScale, setCanvasScale] = useState(1);

  // Student Info Style
  const [studentInfoStyle, setStudentInfoStyle] = useState<'Standard' | 'Grid'>('Standard');

  // MCQ Grid Controls
  const [mcqColumns, setMcqColumns] = useState<number>(4);
  const [verticalSpacing, setVerticalSpacing] = useState<number>(2);
  const [questionGap, setQuestionGap] = useState<number>(12);
  const [bilingualInline, setBilingualInline] = useState(true);
  const [boardExamFormat, setBoardExamFormat] = useState(false);
  const [showQuestionMarks, setShowQuestionMarks] = useState(paper.showQuestionMarks ?? true);
  const [printViewMode, setPrintViewMode] = useState<'both' | 'objective' | 'subjective'>('both');
  const [languageMode, setLanguageMode] = useState<'English' | 'Urdu' | 'Bilingual'>(() => {
    const mediums = Object.values(paper.structure || {}).map((s: any) => s.languageMedium).filter(Boolean) as Array<'English' | 'Urdu' | 'Bilingual'>;
    if (mediums.length === 0) return 'Bilingual';
    const first = mediums[0];
    const allSame = mediums.every(m => m === first);
    return allSame ? first : 'Bilingual';
  });
  const showEnglish = languageMode === 'Bilingual' || languageMode === 'English';
  const showUrdu = languageMode === 'Bilingual' || languageMode === 'Urdu';

  useEffect(() => {
    setShowQuestionMarks(paper.showQuestionMarks ?? true);
  }, [paper.showQuestionMarks]);

  // Printing Options
  const [printSyllabus, setPrintSyllabus] = useState(false);
  const [printBubbleSheet, setPrintBubbleSheet] = useState(false);
  const [printAnswerKey, setPrintAnswerKey] = useState(false);
  const [separateSubjective, setSeparateSubjective] = useState(false); // New State for Page Break

  // Interaction State
  const [isToolbarOpen, setIsToolbarOpen] = useState(true);
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(paper.questions);
  const [removedSections, setRemovedSections] = useState<Set<string>>(new Set());
  const [removedInfoFields, setRemovedInfoFields] = useState<Set<string>>(new Set());

  // Derived show answers logic
  const showAnswersInline = answerKeyDisplay === 'inline';
  const showAnswersBottom = answerKeyDisplay === 'bottom';

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
    } else if (textSizeMode === 'OptionLabel') {
      setOptionLabelSize(prev => Math.max(6, Math.min(20, prev + delta)));
    } else if (textSizeMode === 'OptionEn') {
      setOptionTextSize(prev => Math.max(6, Math.min(20, prev + delta)));
    } else if (textSizeMode === 'OptionUr') {
      setOptionUrduSize(prev => Math.max(5, Math.min(24, prev + delta)));
    }
  };

  // Direct font size setter for typed input
  const setFontSizeDirectly = (val: number) => {
    if (isNaN(val) || val < 1) return;
    if (textSizeMode === 'English') setEnglishFontSize(Math.max(8, Math.min(32, val)));
    else if (textSizeMode === 'Urdu') setUrduFontSize(Math.max(8, Math.min(48, val)));
    else if (textSizeMode === 'Header') setSchoolNameSize(Math.max(16, Math.min(64, val)));
    else if (textSizeMode === 'OptionLabel') setOptionLabelSize(Math.max(6, Math.min(20, val)));
    else if (textSizeMode === 'OptionEn') setOptionTextSize(Math.max(6, Math.min(20, val)));
    else if (textSizeMode === 'OptionUr') setOptionUrduSize(Math.max(5, Math.min(24, val)));
  };

  const activeFontSizeDisplay = useMemo(() => {
    if (textSizeMode === 'English') return englishFontSize;
    if (textSizeMode === 'Urdu') return urduFontSize;
    if (textSizeMode === 'OptionLabel') return optionLabelSize;
    if (textSizeMode === 'OptionEn') return optionTextSize;
    if (textSizeMode === 'OptionUr') return optionUrduSize;
    return schoolNameSize;
  }, [textSizeMode, englishFontSize, urduFontSize, optionLabelSize, optionTextSize, optionUrduSize, schoolNameSize]);

  const sectionsList = useMemo(() => {
    return (Object.values(paper.structure || {}) as PaperSectionConfig[])
      .filter(sec => !removedSections.has(sec.id))
      .sort((a, b) => {
        const aNum = parseInt(a.title.match(/\d+/)?.[0] || '0');
        const bNum = parseInt(b.title.match(/\d+/)?.[0] || '0');
        return aNum - bNum;
      });
  }, [paper.structure, removedSections]);

  const objectiveSections = useMemo(() => {
    if (printViewMode === 'subjective') return [];
    return sectionsList.filter(s => s.category === 'Objective');
  }, [sectionsList, printViewMode]);

  const subjectiveSections = useMemo(() => {
    if (printViewMode === 'objective') return [];
    return sectionsList.filter(s => s.category !== 'Objective');
  }, [sectionsList, printViewMode]);

  const isLongQuestionSection = (section: PaperSectionConfig) => {
    if (section.sectionRole) return section.sectionRole === 'LONG_QUESTION';
    const normalizedType = String(section.questionType || '').toLowerCase();
    return Boolean(section.hasParts) || normalizedType.includes('long') || normalizedType.includes('essay');
  };

  const subjectiveShortSections = useMemo(() => {
    return subjectiveSections.filter(s => !isLongQuestionSection(s));
  }, [subjectiveSections]);

  const subjectiveLongSections = useMemo(() => {
    return subjectiveSections.filter(s => isLongQuestionSection(s));
  }, [subjectiveSections]);

  const mcqsCount = questions.filter(q => isMCQType(q.type)).length;

  const visibleSectionsSet = useMemo(() => {
    const set = new Set<string>();
    if (printViewMode !== 'subjective') {
      sectionsList.filter(s => s.category === 'Objective').forEach(s => set.add(s.id));
    }
    if (printViewMode !== 'objective') {
      sectionsList.filter(s => s.category !== 'Objective').forEach(s => set.add(s.id));
    }
    return set;
  }, [sectionsList, printViewMode]);

  // Calculate dynamic total marks based on visible questions / sections that the student attempts
  const calculatedTotalMarks = useMemo(() => {
    let total = 0;

    // 1. Objective attempt marks
    if (printViewMode !== 'subjective') {
      objectiveSections.forEach(sec => {
        total += (sec.selectCount * sec.marksPerQuestion);
      });
    }

    // 2. Subjective Short attempt marks
    if (printViewMode !== 'objective') {
      subjectiveShortSections.forEach(sec => {
        total += (sec.selectCount * sec.marksPerQuestion);
      });
    }

    // 3. Subjective Long attempt marks (configuration-driven, no Q9/title assumptions)
    if (printViewMode !== 'objective' && subjectiveLongSections.length > 0) {
      const compulsorySections = subjectiveLongSections.filter(s => s.isCompulsory);
      const optionalSections = subjectiveLongSections.filter(s => !s.isCompulsory);
      const sectionMarks = (s: PaperSectionConfig) => s.parts && s.parts.length > 0
        ? s.parts.reduce((a, p) => a + p.marks, 0)
        : s.marksPerQuestion;

      compulsorySections.forEach(s => { total += sectionMarks(s); });
      const configuredAttempts = paper.attemptLongQuestions ?? subjectiveLongSections.reduce((max, s) => Math.max(max, s.selectCount || 0), 0);
      const optionalAttemptCount = Math.max(0, configuredAttempts - compulsorySections.length);
      optionalSections.map(sectionMarks).sort((a, b) => b - a).slice(0, optionalAttemptCount).forEach(marks => { total += marks; });
    }

    // If calculated total is 0, fallback to paper.totalMarks
    if (total === 0) return paper.totalMarks || 75;
    return total;
  }, [objectiveSections, subjectiveShortSections, subjectiveLongSections, printViewMode, paper.totalMarks]);

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

  const renderBoardLayout = () => {
    const showObj = printViewMode === 'both' || printViewMode === 'objective';
    const showSub = printViewMode === 'both' || printViewMode === 'subjective';

    const renderBoardHeader = (type: 'objective' | 'subjective') => {
      const isObj = type === 'objective';
      const subNameEn = paper.subject.toUpperCase();
      const getUrduSubject = (sub: string) => {
        const s = sub.toLowerCase();
        if (s.includes('math')) return 'ریاضی (سائنس)';
        if (s.includes('chem')) return 'کیمسٹری';
        if (s.includes('phys')) return 'فزکس';
        if (s.includes('bio')) return 'بائیولوجی';
        if (s.includes('comp')) return 'کمپیوٹر سائنس';
        if (s.includes('urdu')) return 'اردو';
        if (s.includes('isl')) return 'اسلامیات';
        if (s.includes('eng')) return 'انگریزی';
        return sub;
      };
      const subNameUr = getUrduSubject(paper.subject);

      const timeAllowedEn = `${paper.durationMinutes || (isObj ? 20 : 130)} Minutes`;
      const timeAllowedUr = `${paper.durationMinutes || (isObj ? 20 : 130)} منٹ`;

      // Calculate dynamic marks based on sections
      const marksVal = isObj
        ? objectiveSections.reduce((sum, s) => sum + (s.selectCount * s.marksPerQuestion), 0)
        : subjectiveSections.reduce((sum, s) => sum + (s.hasParts ? (s.parts || []).reduce((acc, p) => acc + p.marks, 0) : (s.selectCount * s.marksPerQuestion)), 0);

      const marksEn = marksVal > 0 ? String(marksVal) : (isObj ? '15' : '60');
      const marksUr = marksVal > 0 ? String(marksVal) : (isObj ? '15' : '60');

      const paperTitleEn = isObj ? 'Q.Paper: 1 (Objective Type)' : 'Paper: 1 (Essay Type)';
      const paperTitleUr = isObj ? 'سوالیہ پرچہ : 1 (معروضی طرز)' : 'پرچہ : 1 (انشائیہ طرز)';

      return (
        <div className="w-full border-b-2 border-black pb-4 mb-4 font-bold text-black text-sm relative group break-inside-avoid animate-fade-in">
          {/* Roll Number Row */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-baseline gap-1 text-[11px]">
              <span>(تعلیمی سیشن 2020-2022 تا 2023-2025)</span>
            </div>
            <div className="flex items-baseline gap-1 flex-row-reverse text-[11px]">
              <span>رول نمبر</span>
              <span className="border-b border-dotted border-black flex-1 min-w-[150px] h-4"></span>
              <span>(امیدوار خود پُر کرے)</span>
            </div>
          </div>

          {/* Main Details Grid */}
          <div dir="ltr" className={`${languageMode === 'Bilingual' ? 'grid grid-cols-3' : 'grid grid-cols-2'} gap-y-2 border-t border-b border-black py-2`}>
            {/* Left Side: English Info */}
            {showEnglish && <div className="flex flex-col gap-1 text-[11px] text-left">
              <div className="font-black" contentEditable suppressContentEditableWarning>{subNameEn}</div>
              <div contentEditable suppressContentEditableWarning>{paperTitleEn}</div>
              <div>Time Allowed: <span contentEditable suppressContentEditableWarning>{timeAllowedEn}</span></div>
              <div>Maximum Marks: <span contentEditable suppressContentEditableWarning>{marksEn}</span></div>
            </div>}

            {/* Middle Side: Group Info */}
            <div className="flex flex-col items-center justify-center text-center text-[11px]">
              <div className="font-black border border-black px-2 py-0.5 rounded" contentEditable suppressContentEditableWarning>024-1st Annual - ({paper.classLevel || '9th Class'})</div>
              <div className="mt-1" contentEditable suppressContentEditableWarning>(پہلا گروپ)</div>
            </div>

            {/* Right Side: Urdu Info */}
            {showUrdu && <div dir="rtl" className="flex flex-col gap-1 text-[11px] text-right font-urdu items-end">
              <div className="font-black" contentEditable suppressContentEditableWarning>{subNameUr}</div>
              <div contentEditable suppressContentEditableWarning>{paperTitleUr}</div>
              <div>وقت: <span contentEditable suppressContentEditableWarning>{timeAllowedUr}</span></div>
              <div>کل نمبر: <span contentEditable suppressContentEditableWarning>{marksUr}</span></div>
            </div>}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* OBJECTIVE PORTION */}
        {showObj && objectiveSections.length > 0 && (
          <div className="objective-portion-wrapper">
            {renderBoardHeader('objective')}
            <div className="space-y-4">
              {objectiveSections.map((sec, idx) => {
                const secQuestions = questions.filter(q => (q as any).sectionId === sec.id);
                if (secQuestions.length === 0) return null;
                return renderBoardExamSection(sec, secQuestions, idx + 1);
              })}
            </div>
          </div>
        )}

        {/* PAGE BREAK (only if printing both parts) */}
        {printViewMode === 'both' && objectiveSections.length > 0 && subjectiveSections.length > 0 && (
          <div className="page-break break-before-page" style={{ pageBreakBefore: 'always', contentVisibility: 'auto' }} />
        )}

        {/* SUBJECTIVE PORTION */}
        {showSub && subjectiveSections.length > 0 && (
          <div className="subjective-portion-wrapper">
            {renderBoardHeader('subjective')}

            {/* PART I: Short Questions */}
            {subjectiveShortSections.length > 0 && (
              <div className="subjective-part-1 mb-8">
                {showPartHeadings && (
                  <div className={`mb-4 pb-1 ${headingBorderClass('Subjective')} px-2 ${languageMode === 'Bilingual' ? 'flex justify-between items-center' : 'text-center'}`}>
                    {(languageMode === 'Bilingual' || languageMode === 'English') && (
                      <span className="font-black uppercase tracking-widest inline-block" style={{ fontSize: `${sectionHeaderSize}px` }} contentEditable suppressContentEditableWarning>PART I (Short Questions)</span>
                    )}
                    {(languageMode === 'Bilingual' || languageMode === 'Urdu') && (
                      <span dir="rtl" className="font-urdu font-black inline-block" style={{ fontSize: `${urduFontSize}px` }} contentEditable suppressContentEditableWarning>حصہ اول (مختصر سوالات)</span>
                    )}
                  </div>
                )}

                <div className={`${layoutMode === 'DoubleColumn' ? 'columns-2 gap-8' : 'space-y-4'}`}>
                  {subjectiveShortSections.map((sec, idx) => {
                    const secQuestions = questions.filter(q => (q as any).sectionId === sec.id);
                    if (secQuestions.length === 0) return null;
                    // Question numbering starts at 2 for Short Questions in Subjective Part I (after MCQ Q1)
                    return renderBoardExamSection(sec, secQuestions, idx + 2);
                  })}
                </div>
              </div>
            )}

            {/* PART II: Long Questions */}
            {subjectiveLongSections.length > 0 && (
              <div className="subjective-part-2">
                {showPartHeadings && (
                  <div className={`mb-2 pb-1 ${headingBorderClass('Subjective')} px-2 ${languageMode === 'Bilingual' ? 'flex justify-between items-center' : 'text-center'}`}>
                    {(languageMode === 'Bilingual' || languageMode === 'English') && (
                      <span className="font-black uppercase tracking-widest inline-block" style={{ fontSize: `${sectionHeaderSize}px` }} contentEditable suppressContentEditableWarning>PART II (Detailed Questions)</span>
                    )}
                    {(languageMode === 'Bilingual' || languageMode === 'Urdu') && (
                      <span dir="rtl" className="font-urdu font-black inline-block" style={{ fontSize: `${urduFontSize}px` }} contentEditable suppressContentEditableWarning>حصہ دوم (انشائیہ سوالات)</span>
                    )}
                  </div>
                )}

                {/* Print the common instruction once unless a section explicitly requests it for every main question. */}
                {!subjectiveLongSections.some(sec => sec.showQuestionStatement === true) && (
                  <div className="flex justify-between items-center my-3 py-2 px-3 border border-black rounded break-inside-avoid">
                    <div className="font-bold italic text-left" style={{ fontSize: `${englishFontSize}px` }} contentEditable suppressContentEditableWarning>
                      {paper.longQuestionInstruction || `Attempt ${paper.attemptLongQuestions || subjectiveLongSections.length} questions in all.${paper.compulsoryQuestionNumber ? ` Question No. ${paper.compulsoryQuestionNumber} is Compulsory.` : ''}`}
                    </div>
                    <div dir="rtl" className="font-urdu font-bold text-right ml-4" style={{ fontSize: `${urduFontSize}px` }} contentEditable suppressContentEditableWarning>
                      {paper.longQuestionInstructionUrdu || `کل ${paper.attemptLongQuestions || subjectiveLongSections.length} سوالات حل کریں۔${paper.compulsoryQuestionNumber ? ` سوال نمبر ${paper.compulsoryQuestionNumber} لازمی ہے۔` : ''}`}
                    </div>
                  </div>
                )}

                <div className={`${layoutMode === 'DoubleColumn' ? 'columns-2 gap-8' : 'space-y-4'}`}>
                  {subjectiveLongSections.map((sec, idx) => {
                    const secQuestions = questions.filter(q => (q as any).sectionId === sec.id);
                    if (secQuestions.length === 0) return null;
                    const qNum = sec.questionNumber || subjectiveShortSections.length + 2 + idx;
                    const isCompulsory = !!sec.isCompulsory || sec.compulsoryQuestionNumber === qNum || paper.compulsoryQuestionNumber === qNum;
                    return (
                      <div key={sec.id} className={`break-inside-avoid ${isCompulsory ? 'border-l-2 border-black pl-2' : ''}`}>
                        {/* Compulsory badge before Q9 */}
                        {isCompulsory && (
                          <div className="flex justify-between items-center mb-1 bg-black text-white px-2 py-0.5 rounded break-inside-avoid">
                            <span className="font-black text-white uppercase tracking-widest text-[9px]">[COMPULSORY / لازمی] — Q.{qNum}</span>
                            <span dir="rtl" className="font-urdu font-black text-white text-[9px]">[لازمی / COMPULSORY] — سوال نمبر {qNum}</span>
                          </div>
                        )}
                        {renderBoardExamSection(sec, secQuestions, qNum)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={isEmbedded ? "flex flex-col h-full bg-gray-100 overflow-hidden relative" : "fixed inset-0 z-[500] bg-gray-100 flex flex-col overflow-hidden print:overflow-visible print:bg-white print:static print:h-auto print:block"}>
      <style>{`
        .preview-bold-all * {
          font-weight: 700 !important;
        }
        /* Subjective headings and number labels are bold; question content stays regular. */
        .preview-subjective-bold:not(.preview-bold-all) [data-section-category="Subjective"] .question-content,
        .preview-subjective-bold:not(.preview-bold-all) [data-section-category="Subjective"] .question-content * {
          font-weight: 400 !important;
        }
        /* Objective Regular is intentionally applied last so it also overrides All Bold. */
        .preview-objective-regular [data-section-category="Objective"] * {
          font-weight: 400 !important;
        }
        .preview-bold-all.preview-objective-regular [data-section-category="Objective"] * {
          font-weight: 400 !important;
        }

        @media print {
          @page { 
            margin: 15mm 10mm 15mm 10mm !important;
            size: ${pageSize} !important;
          }
          
          html, body, #root, main { 
            background: white !important; 
            height: auto !important; 
            overflow: visible !important; 
            display: block !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .no-print, .no-print-section { display: none !important; }
          
          .break-before-page { 
            break-before: page !important; 
            page-break-before: always !important; 
            display: block !important; 
            margin-top: 0 !important; 
            padding-top: 5mm !important;
            border-top: none !important; 
          }
          
          /* FIX: Hide KaTeX MathML Accessibility Layer to prevent double text */
          .katex-mathml {
            display: none !important;
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
            padding: 0 !important;
            box-sizing: border-box !important;
            overflow: visible !important;
            display: block !important;
          }
          
          /* PREVENT TEXT CUTOFF AT PAGE BOTTOM */
          #exam-paper-container div,
          #exam-paper-container p,
          #exam-paper-container span {
            overflow: visible !important;
            clip-path: none !important;
          }
          
          /* Ensure text wraps properly and doesn't overflow */
          * {
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
          }
          
          /* Keep question cards together without changing native table rows
             into block elements. Grid mode uses <tr> elements. */
          .question-wrapper {
            page-break-inside: avoid !important;
            break-inside: avoid-page !important;
            display: block !important;
            position: relative !important;
            overflow: visible !important;
            /* Extra padding to prevent descenders (y, g, p) from being cut at page breaks */
            padding-bottom: 2px !important;
            margin-bottom: 1rem !important;
          }

          /* Grid mode must retain the browser's table layout in print. */
          #exam-paper-container table {
            width: 100% !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
          }

          #exam-paper-container thead { display: table-header-group !important; }
          #exam-paper-container tbody { display: table-row-group !important; }
          #exam-paper-container tr {
            display: table-row !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          #exam-paper-container th,
          #exam-paper-container td { display: table-cell !important; }

          .screen-scale-wrapper {
            transform: none !important;
          }
        }

        /* FORCE STRICT GRID LAYOUT FOR PRINT PAPER CONTAINER ACROSS ALL ZOOM LEVELS & SCREEN MEDIA QUERIES */
        #exam-paper-container .print-header-grid {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
        #exam-paper-container .grid-cols-2 {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        #exam-paper-container .grid-cols-3 {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
        #exam-paper-container .grid-cols-4 {
          display: grid !important;
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        }
      `}</style>

      {/* TOP TOOLBAR — compact and collapsible, like the editor sidebar */}
      <header className="bg-[#0F172A] border-b border-slate-800 text-white shrink-0 z-50 print:hidden shadow-md px-3 sm:px-5 py-2 sm:py-3">
        {/* Row 1: Branding + Actions */}
        <div className="flex items-center justify-between gap-3 mb-2">
          {/* Left: Branding & Exit */}
          <div className="flex items-center gap-3 shrink-0">
            {!isEmbedded && (
              <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X size={22} />
              </button>
            )}
            <div className="flex flex-col">
              <span className="font-black text-sm sm:text-lg tracking-wide text-white">Print Preview</span>
              <span className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest">{pageSize} Mode</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1 bg-slate-900/40 border border-slate-700 rounded-lg px-2 py-2">
              <button onClick={() => setCanvasScale(s => Math.max(0.6, Math.round((s - 0.1) * 10) / 10))} className="p-2 rounded hover:bg-slate-800 text-slate-300" title="Zoom out">
                <Minus size={16} />
              </button>
              <span className="w-12 text-center text-xs font-black text-slate-200 tabular-nums">{Math.round(canvasScale * 100)}%</span>
              <button onClick={() => setCanvasScale(s => Math.min(1.6, Math.round((s + 0.1) * 10) / 10))} className="p-2 rounded hover:bg-slate-800 text-slate-300" title="Zoom in">
                <Plus size={16} />
              </button>
              <button onClick={() => setCanvasScale(1)} className="ml-1 px-2 py-1.5 rounded hover:bg-slate-800 text-[11px] font-black text-slate-300 uppercase tracking-widest" title="Reset zoom">
                100
              </button>
            </div>
            <button onClick={() => setIsManualEdit(!isManualEdit)} className={`p-2.5 rounded-lg transition-colors ${isManualEdit ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Edit Mode">
              <Edit3 size={20} />
            </button>
            <button onClick={() => setIsToolbarOpen(v => !v)} className="p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800" title={isToolbarOpen ? 'Close preview controls' : 'Open preview controls'} aria-label={isToolbarOpen ? 'Close preview controls' : 'Open preview controls'}>
              {isToolbarOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-900/50 transition-all active:scale-95">
              <Printer size={18} /> <span className="hidden sm:inline">Print</span> PDF
            </button>
          </div>
        </div>

        {/* Controls: one compact flow that naturally settles into two rows on smaller screens */}
        {isToolbarOpen && <div className="flex flex-wrap items-center gap-2">
          {/* 1. Language & Layout */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <select value={languageMode} onChange={e => setLanguageMode(e.target.value as any)} className="print-preview-select bg-transparent text-xs font-black text-white outline-none w-24">
              <option value="Bilingual">Bilingual</option>
              <option value="English">English</option>
              <option value="Urdu">Urdu</option>
            </select>
            <div className="w-px h-5 bg-slate-700"></div>
            <select value={printViewMode} onChange={e => setPrintViewMode(e.target.value as any)} className="print-preview-select bg-transparent text-xs font-black text-white outline-none w-28">
              <option value="both">Full Paper</option>
              <option value="objective">Objective Only</option>
              <option value="subjective">Essay Type Only</option>
            </select>
            <div className="w-px h-5 bg-slate-700"></div>
            <button
              onClick={() => setLayoutMode(m => m === 'DoubleColumn' ? 'Standard' : 'DoubleColumn')}
              className={`p-2 rounded ${layoutMode === 'DoubleColumn' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title={layoutMode === 'DoubleColumn' ? 'Double Print (2 Columns)' : 'Single Print (1 Column)'}
            >
              <Columns size={18} />
            </button>
            <button onClick={() => setIsGridView(!isGridView)} className={`p-2 rounded ${isGridView ? 'bg-indigo-600 text-white' : 'text-slate-400'}`} title="Grid Mode">
              <TableIcon size={18} />
            </button>
            <button
              onClick={() => setShowQuestionMarks(v => {
                const next = !v;
                onShowQuestionMarksChange?.(next);
                return next;
              })}
              className={`p-2 rounded ${showQuestionMarks ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              title={showQuestionMarks ? 'Hide marks on each question' : 'Show marks on each question'}
            >
              <Hash size={18} />
            </button>
            <select value={pageSize} onChange={e => setPageSize(e.target.value as any)} className="print-preview-select bg-transparent text-xs font-black text-white outline-none w-20">
              <option value="A4">A4</option>
              <option value="Legal">Legal</option>
              <option value="Letter">Letter</option>
            </select>
          </div>

          {/* 2. Font Size Controls with editable input */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <select
              value={textSizeMode}
              onChange={e => setTextSizeMode(e.target.value as any)}
              className="print-preview-select bg-transparent text-xs font-black text-white outline-none w-24 sm:w-28"
            >
              <option value="English">Q (English)</option>
              <option value="Urdu">Q (Urdu)</option>
              <option value="OptionEn">Opt (EN)</option>
              <option value="OptionUr">Opt (UR)</option>
              <option value="OptionLabel">A/B/C</option>
              <option value="Header">Header</option>
            </select>
            <div className="w-px h-5 bg-slate-700"></div>
            <div className="flex items-center gap-1">
              <button onClick={() => adjustFontSize(-1)} className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 text-white"><Minus size={14} /></button>
              <input
                type="number"
                value={activeFontSizeDisplay}
                onChange={e => setFontSizeDirectly(parseInt(e.target.value))}
                className="w-12 text-center text-xs font-bold text-indigo-300 bg-slate-900/60 border border-slate-600 rounded px-1 py-1 outline-none focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min={8}
                max={64}
              />
              <span className="text-[10px] text-slate-500 font-bold">px</span>
              <button onClick={() => adjustFontSize(1)} className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 text-white"><Plus size={14} /></button>
            </div>
          </div>

          {/* 3. Extras — kept directly after font-size controls on the first toolbar row */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 border-l border-slate-700 pl-2">
            <button onClick={() => setStudentInfoStyle(prev => prev === 'Standard' ? 'Grid' : 'Standard')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold uppercase whitespace-nowrap transition-all ${studentInfoStyle === 'Grid' ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-400' : 'bg-transparent border-slate-700 text-slate-400'}`} title="Student Grid Header">
              <UserSquare2 size={16} /> <span className="hidden sm:inline">Header</span> Grid
            </button>
            <button onClick={() => setPrintBubbleSheet(!printBubbleSheet)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold uppercase whitespace-nowrap transition-all ${printBubbleSheet ? 'bg-emerald-600/20 border-emerald-600/50 text-emerald-400' : 'bg-transparent border-slate-700 text-slate-400'}`}>
              <Grid3X3 size={16} /> OMR
            </button>
            <button onClick={() => setPrintAnswerKey(!printAnswerKey)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold uppercase whitespace-nowrap transition-all ${printAnswerKey ? 'bg-emerald-600/20 border-emerald-600/50 text-emerald-400' : 'bg-transparent border-slate-700 text-slate-400'}`}>
              <CheckSquare size={16} /> Key
            </button>
            <button onClick={() => setSeparateSubjective(!separateSubjective)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold uppercase whitespace-nowrap transition-all ${separateSubjective ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-400' : 'bg-transparent border-slate-700 text-slate-400'}`} title="Print Subjective Part on Separate Page">
              <Layers size={16} /> Split
            </button>
            <button onClick={() => setBoardExamFormat(p => !p)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold uppercase whitespace-nowrap transition-all ${boardExamFormat ? 'bg-amber-600/30 border-amber-500/50 text-amber-300' : 'bg-transparent border-slate-700 text-slate-400 hover:text-amber-300'}`} title="Pakistani Board Exam Format (Bilingual side-by-side rows)">
              <FileText size={16} /> Board Format
            </button>
          </div>

          {/* 4. Typography, spacing, and MCQ layout */}
          <div className="flex flex-wrap items-center gap-2 px-2.5 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700">
            <label className="flex items-center gap-1 text-[10px] font-black text-slate-300 uppercase">Font
              <select value={englishFont} onChange={e => setEnglishFont(e.target.value)} className="print-preview-select bg-slate-900 text-white text-xs rounded px-1.5 py-1">
                <option value="'Inter', sans-serif">Inter</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="Georgia, serif">Georgia</option>
              </select>
            </label>
            <label className="flex items-center gap-1 text-[10px] font-black text-slate-300 uppercase">Urdu
              <select value={urduFont} onChange={e => setUrduFont(e.target.value)} className="print-preview-select bg-slate-900 text-white text-xs rounded px-1.5 py-1">
                <option value="'Noto Nastaliq Urdu', serif">Nastaliq</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Jameel Noori Nastaleeq', serif">Jameel Noori</option>
              </select>
            </label>
            <label className="flex items-center gap-1 text-[10px] font-black text-slate-300 uppercase">Heading
              <select value={headingBorderMode} onChange={e => setHeadingBorderMode(e.target.value as 'subjective' | 'all' | 'none')} className="print-preview-select bg-slate-900 text-white text-xs rounded px-1.5 py-1">
                <option value="subjective">Subjective only</option>
                <option value="all">All headings</option>
                <option value="none">No borders</option>
              </select>
            </label>
            <button onClick={() => setBoldAllText(v => !v)} className={`px-2 py-1 rounded border text-[10px] font-black uppercase whitespace-nowrap ${boldAllText ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700 text-slate-400'}`} title="Bold all paper text">
              <Bold size={13} className="inline mr-1" />All Bold
            </button>
            <button onClick={() => setObjectiveBold(v => !v)} className={`px-2 py-1 rounded border text-[10px] font-black uppercase whitespace-nowrap ${objectiveBold ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700 text-slate-400'}`} title="Toggle bold objective questions">
              Objective {objectiveBold ? 'Bold' : 'Regular'}
            </button>
            <RangeControl label="Line" value={lineHeight} setValue={setLineHeight} min={1} max={2.5} step={0.1} width="w-14" />
            <RangeControl label="Q Gap" value={questionGap} setValue={setQuestionGap} min={0} max={40} width="w-14" />
            <RangeControl label="Opt Gap" value={verticalSpacing} setValue={setVerticalSpacing} min={0} max={16} width="w-14" />
            <RangeControl label="Margin" value={pagePadding} setValue={setPagePadding} min={0} max={40} unit="mm" width="w-16" />
            <RangeControl label="MCQ Cols" value={mcqColumns} setValue={setMcqColumns} min={1} max={4} width="w-14" />
          </div>

          {/* 4. Visibility & Watermark */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <button onClick={() => setHeaderVisibility(v => ({ ...v, logo: !v.logo }))} className={`p-2 rounded border ${headerVisibility.logo ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-300' : 'bg-transparent border-slate-700 text-slate-500'}`} title="Logo">
              <ImageIcon size={18} />
            </button>
            <button onClick={() => setHeaderVisibility(v => ({ ...v, marksBox: !v.marksBox }))} className={`p-2 rounded border ${headerVisibility.marksBox ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-300' : 'bg-transparent border-slate-700 text-slate-500'}`} title="Marks Box">
              <Square size={18} />
            </button>
            <div className="w-px h-5 bg-slate-700"></div>
            <button onClick={cycleWatermark} className={`p-2 rounded border ${watermark !== 'None' ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-300' : 'bg-transparent border-slate-700 text-slate-500'}`} title={`Watermark: ${watermark}`}>
              <Globe size={18} />
            </button>
            {watermark !== 'None' && (
              <>
                <RangeControl label="Opacity" value={watermarkOpacity} setValue={setWatermarkOpacity} min={0.05} max={1.0} step={0.05} width="w-16" />
                <RangeControl label="Size" value={watermarkSize} setValue={setWatermarkSize} min={20} max={200} step={10} width="w-16" />
              </>
            )}
          </div>

        </div>}
      </header>

      {/* PAPER CANVAS */}
      <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-8 flex justify-center custom-scrollbar scroll-smooth print:p-0 print:overflow-visible print:h-auto print:block relative">
        <div className="screen-scale-wrapper transition-transform" style={{ transform: `scale(${canvasScale})`, transformOrigin: 'top center' }}>
          <div
            id="exam-paper-container"
            className={`preview-paper preview-subjective-bold ${boldAllText ? 'preview-bold-all' : ''} ${!objectiveBold ? 'preview-objective-regular' : ''} bg-white relative transition-all origin-top min-h-[297mm] mx-auto print:min-h-0 print:h-auto print:w-full print:mx-0 print:bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] ring-1 ring-black/5 ${isManualEdit ? 'ring-1 ring-amber-500 ring-dashed' : ''}`}
            style={{
              fontSize: `${englishFontSize}px`,
              lineHeight: lineHeight,
              color: fontColor,
              fontWeight: boldAllText ? '700' : fontWeight,
              fontFamily: englishFont,
              width: pageStyles[pageSize].width,
              padding: `${pagePadding}mm`
            }}
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
                    <img src={paper.headerConfig?.logoUrl} className="w-[120mm]" style={{ transform: 'rotate(45deg)' }} />
                  ) : (
                    watermark === 'Confidential' ? (
                      <h1 className="font-black text-slate-300 whitespace-nowrap text-[8vw] leading-none text-center">
                        {paper.headerConfig?.schoolName || 'SCHOOL NAME'}
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
                      {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({ ...v, logo: false }))} className="absolute -top-3 -left-3 p-1.5 bg-red-500 text-white rounded-full z-20 shadow-lg print:hidden hover:bg-red-600 transition-colors"><Trash2 size={12} /></button>}
                      <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
                        <img src={paper.headerConfig?.logoUrl} className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                  <div className="flex-1 text-center">
                    {headerVisibility.schoolName && (
                      <div className="relative group inline-block mx-auto">
                        {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({ ...v, schoolName: false }))} className="absolute -top-4 -left-8 p-1.5 bg-red-500 text-white rounded-full z-20 shadow-lg print:hidden opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"><Trash2 size={12} /></button>}
                        <h1 style={{ fontSize: `${schoolNameSize}px` }} contentEditable={isManualEdit} suppressContentEditableWarning={true} className={`font-black text-slate-900 uppercase tracking-tighter leading-[1] mb-1 outline-none ${isManualEdit ? 'bg-amber-50 rounded p-1 border-dashed border border-amber-300' : ''}`}>
                          {paper.headerConfig?.schoolName || 'Institution Name'}
                        </h1>
                      </div>
                    )}

                    <div className="relative group">
                      {headerVisibility.examTitle && (
                        <>
                          {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({ ...v, examTitle: false }))} className="absolute -top-2 -left-6 p-1 bg-red-500 text-white rounded-full z-20 shadow-lg print:hidden opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"><Trash2 size={10} /></button>}
                          <h2 contentEditable={isManualEdit} suppressContentEditableWarning={true} className={`text-xl font-bold text-slate-700 uppercase tracking-[0.2em] outline-none ${isManualEdit ? 'bg-amber-50 rounded p-1 border-dashed border border-amber-300' : ''}`}>
                            {paper.headerConfig?.examTitle || 'EXAMINATION'}
                          </h2>
                        </>
                      )}
                    </div>

                    <div className="flex justify-center gap-3 mt-3">
                      {headerVisibility.sessionTag && (
                        <div className="relative group">
                          {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({ ...v, sessionTag: false }))} className="absolute -top-3 -left-4 p-0.5 bg-red-500 text-white rounded-full z-20 print:hidden opacity-0 group-hover:opacity-100"><Trash2 size={8} /></button>}
                          <span contentEditable={isManualEdit} suppressContentEditableWarning={true} className="text-[10px] font-black uppercase bg-black text-white px-3 py-1 rounded outline-none">SESSION 2024-2025</span>
                        </div>
                      )}
                      {headerVisibility.assessmentTag && (
                        <div className="relative group">
                          {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({ ...v, assessmentTag: false }))} className="absolute -top-3 -left-4 p-0.5 bg-red-500 text-white rounded-full z-20 print:hidden opacity-0 group-hover:opacity-100"><Trash2 size={8} /></button>}
                          <span contentEditable={isManualEdit} suppressContentEditableWarning={true} className="text-[10px] font-black uppercase border-2 border-black px-3 py-1 rounded outline-none">INTERNAL ASSESSMENT</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {headerVisibility.marksBox && (
                    <div className="w-20 h-20 border-2 border-black flex flex-col items-center justify-center shrink-0 rounded-lg relative group">
                      {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({ ...v, marksBox: false }))} className="absolute -top-3 -right-3 p-1 bg-red-500 text-white rounded-full z-20 print:hidden opacity-0 group-hover:opacity-100"><Trash2 size={10} /></button>}
                      <span className="text-[7px] font-black uppercase text-slate-500 tracking-widest">Total Marks</span>
                      <span contentEditable={isManualEdit} suppressContentEditableWarning={true} className="text-3xl font-black outline-none">{calculatedTotalMarks}</span>
                    </div>
                  )}
                </div>

                {headerVisibility.studentInfo && (
                  <div className="relative group pt-4">
                    {isManualEdit && <button onClick={() => setHeaderVisibility(v => ({ ...v, studentInfo: false }))} className="absolute -left-6 top-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden hover:scale-110"><Trash2 size={16} /></button>}

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
                      <div className="grid grid-cols-3 print-header-grid gap-y-3 gap-x-6 sm:gap-x-8 border-t border-slate-200 pt-4 relative">
                        {infoFields.map((field, i) => (
                          <div key={i} className="flex items-baseline border-b border-dotted border-slate-300 pb-1 relative group/field">
                            {isManualEdit && <button onClick={() => removeInfoField(field.label)} className="absolute -left-4 top-0 text-red-500 opacity-0 group-hover/field:opacity-100 transition-opacity print:hidden hover:scale-110"><X size={10} /></button>}
                            <span className="text-[9px] font-black uppercase text-slate-500 w-24 shrink-0">{field.label}:</span>
                            <span contentEditable={isManualEdit} suppressContentEditableWarning={true} className="text-[11px] font-bold text-black flex-1 truncate outline-none min-h-[1.2em]">{field.value}</span>
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
                    {questions.filter(q => isMCQType(q.type)).map((q, idx) => {
                      const optionCount = getMcqOptions(q).length || 4;
                      const bubbles = Array.from({ length: optionCount }, (_, i) => String.fromCharCode(65 + i));

                      return (
                        <div key={idx} className="break-inside-avoid flex items-center gap-2 border-b border-dotted border-slate-300 pb-0.5 pr-2 mb-1">
                          <span className="text-[9px] font-black text-slate-900 w-5 text-right">{idx + 1}.</span>
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
                    <div className={`text-center mb-3 pb-1 ${headingBorderClass('Objective')}`}>
                      {boardExamFormat ? (
                        <div className="flex justify-between items-center px-2">
                          <span className="font-black uppercase tracking-widest" style={{ fontSize: `${sectionHeaderSize}px` }}>Part I: Objective</span>
                          <span dir="rtl" className="font-urdu font-black" style={{ fontSize: `${urduFontSize}px` }}>حصہ اول – معروضی</span>
                        </div>
                      ) : (
                        <h2 className="text-lg font-black uppercase tracking-widest">Part I: Objective</h2>
                      )}
                    </div>
                  )}
                  <div className={`flex-1 ${layoutMode === 'DoubleColumn' && !isGridView ? 'columns-2 gap-8' : 'space-y-1'}`}>
                    {(() => {
                      let qNum = 1;
                      return objectiveSections.map((sec) => {
                        const secQuestions = questions.filter(q => (q as any).sectionId === sec.id);
                        if (secQuestions.length === 0) return null;
                        const result = boardExamFormat
                          ? renderBoardExamSection(sec, secQuestions, qNum)
                          : renderSection(sec, secQuestions, qNum);
                        qNum++;
                        return result;
                      });
                    })()}
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
                    <div className={`text-center mb-3 pb-1 ${headingBorderClass('Subjective')}`}>
                      {boardExamFormat ? (
                        <div className="flex justify-between items-center px-2">
                          <span className="font-black uppercase tracking-widest" style={{ fontSize: `${sectionHeaderSize}px` }}>Subjective</span>
                          <span dir="rtl" className="font-urdu font-black" style={{ fontSize: `${urduFontSize}px` }}>انشائی حصہ</span>
                        </div>
                      ) : (
                        <h2 className="text-lg font-black uppercase tracking-widest">Subjective</h2>
                      )}
                    </div>
                  )}
                  <div className={`flex-1 ${layoutMode === 'DoubleColumn' && !isGridView ? 'columns-2 gap-8' : 'space-y-1'}`}>
                    {(() => {
                      let qNum = objectiveSections.filter(sec => questions.some(q => (q as any).sectionId === sec.id)).length + 1;
                      let longHeadingRendered = false;

                      return subjectiveSections.map((sec) => {
                        const secQuestions = questions.filter(q => (q as any).sectionId === sec.id);
                        if (secQuestions.length === 0) return null;

                        const currentQuestionNumber = qNum++;
                        const isLongSection = isLongQuestionSection(sec);
                        const showLongHeading = isLongSection && !longHeadingRendered;
                        if (showLongHeading) longHeadingRendered = true;

                        return (
                          <React.Fragment key={sec.id}>
                            {showLongHeading && showPartHeadings && (
                              <div className="my-4 break-inside-avoid border-y-2 border-black py-2">
                                <div className="flex items-center justify-between gap-4">
                                  {showEnglish && (
                                    <h2 className="font-black uppercase tracking-widest whitespace-pre-line" style={{ fontSize: `${sectionHeaderSize}px` }}>
                                      {paper.longQuestionHeading || 'Subjective Part II'}
                                    </h2>
                                  )}
                                  {showUrdu && (
                                    <h2 dir="rtl" className="font-urdu font-black text-right whitespace-pre-line" style={{ fontSize: `${urduFontSize}px` }}>
                                      {paper.longQuestionHeadingUrdu || 'حصہ دوم – تفصیلی سوالات'}
                                    </h2>
                                  )}
                                </div>
                                <div className="mt-1 flex items-start justify-between gap-4">
                                  {showEnglish && (
                                    <p className="font-bold italic whitespace-pre-line" style={{ fontSize: `${englishFontSize}px` }}>
                                      {paper.longQuestionInstruction || 'Write detailed answers to the following questions.'}
                                    </p>
                                  )}
                                  {showUrdu && (
                                    <p dir="rtl" className="font-urdu font-bold text-right whitespace-pre-line" style={{ fontSize: `${urduFontSize}px` }}>
                                      {paper.longQuestionInstructionUrdu || 'درج ذیل سوالات کے تفصیلی جوابات لکھیں۔'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            {boardExamFormat
                              ? renderBoardExamSection(sec, secQuestions, currentQuestionNumber)
                              : renderSection(sec, secQuestions, currentQuestionNumber)}
                          </React.Fragment>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* TEACHER COPY ANSWER KEY (Inline Logic) */}
              {printAnswerKey && mcqsCount > 0 && (
                <div className="mt-8 p-6 border-t-[3px] border-black bg-slate-50/50 break-inside-avoid rounded-2xl">
                  <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-black">
                    <CheckCircle2 size={14} /> Official Answer Reference Key
                  </h4>
                  <div className="grid grid-cols-10 gap-2">
                    {questions.filter(q => isMCQType(q.type)).map((q, idx) => (
                      <div key={idx} className="flex flex-col border border-slate-200 bg-white p-1.5 rounded-lg text-center shadow-sm">
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Q.{idx + 1}</span>
                        <span className="text-sm font-black text-indigo-700 leading-none mt-1">
                          <MathRenderer text={q.correctAnswer || 'N/A'} inline />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ANSWER KEY SECTION (AT BOTTOM) */}
              {showAnswersBottom && (
                <div className="mt-8 pt-8 border-t-4 border-black break-before-page" style={{ pageBreakBefore: 'always' }}>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-widest border-b-4 border-black inline-block pb-2">Full Answer Key</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-2">Official Grading Reference</p>
                  </div>

                  <div className="space-y-8">
                    {sectionsList.map(sec => {
                      const secQuestions = questions.filter(q => q.sectionId === sec.id);
                      if (secQuestions.length === 0) return null;

                      return (
                        <div key={sec.id} className="break-inside-avoid">
                          <h3 className="font-bold text-sm uppercase tracking-wider mb-3 border-b border-gray-300 pb-1">{sec.title}</h3>
                          <div className={`grid gap-4 ${sec.category === 'Objective' ? 'grid-cols-4' : 'grid-cols-1'}`}>
                            {secQuestions.map((q, idx) => (
                              <div key={q.id} className="text-xs">
                                <span className="font-black mr-2">
                                  {sec.subQuestionNumbering === 'Roman' ? `${["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"][idx] || idx + 1}.` : `${idx + 1}.`}
                                </span>
                                <span className="font-medium text-slate-700">
                                  {isMCQType(q.type) ? (
                                    <span className="font-bold">{q.correctAnswer || 'N/A'}</span>
                                  ) : (
                                    <MathRenderer text={q.correctAnswer || 'Answer Key Not Available'} inline />
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  /* ─────────────────────────────────────────────────────────
     BOARD EXAM FORMAT — Pakistani official bilingual layout
     Section heading: marks | Q.N  English instruction .... Urdu instruction
     Sub-questions : (i) English text ............ Urdu text   (i)
  ───────────────────────────────────────────────────────── */
  function renderBoardExamSection(sec: PaperSectionConfig, secQuestions: Question[], qNum: number) {
    if (isGridView) {
      return renderSection(sec, secQuestions);
    }

    const romanNums = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv'];

    // Calculate total marks for this section/question
    const partCount = Math.max(1, sec.longPartCount || (sec.parts || []).length || 1);
    const sectionMarks = sec.hasParts
      ? (sec.parts || []).slice(0, partCount).reduce((a, p) => a + p.marks, 0)
      : (sec.marksPerQuestion * sec.selectCount);

    const engInstruction = sec.instruction || getDefaultSectionInstruction(sec.questionType, sec.selectCount, sec.totalCount);
    const urInstruction = sec.instructionUrdu || getDefaultSectionInstructionUrdu(sec.questionType, sec.selectCount, sec.totalCount);

    // Internal-choice behavior comes from scheme configuration, not a Q9/title heuristic.
    const hasInternalChoice = Boolean(sec.hasInternalChoice);

    // Helper functions for bilingual part extraction
    const cleanPartText = (text: string | undefined) => {
      if (!text) return '';
      // Generated questions may already contain their printed number/part label;
      // the board renderer supplies that label separately. Remove only leading labels.
      let cleaned = text.trim();
      for (let pass = 0; pass < 2; pass += 1) {
        cleaned = cleaned
          .replace(/^\s*Q\s*[.\-]?\s*\d+\s*(?:[.\-:]\s*)?(?:\(?\s*[a-z]\s*[).:]?\s*)?/i, '')
          .replace(/^\s*\d+\s*[.\-:]\s*(?:\(?\s*[a-z]\s*[).:]?\s*)/i, '')
          .replace(/^\s*\d+\s+(?:\(?\s*[a-z]\s*[).:]?\s*)/i, '')
          .replace(/^\s*\([a-z\u0600-\u06FF]\)\s*/i, '')
          .trim();
      }
      return cleaned;
    };

    const getPartLabelEn = (qId: string, idx: number) => {
      const match = qId.match(/_part_([a-z])_/i);
      return match ? match[1].toLowerCase() : (idx === 0 ? 'a' : 'b');
    };

    const getPartLabelUr = (labelEn: string) => {
      const mapping: Record<string, string> = { a: 'الف', b: 'ب', c: 'ج', d: 'د', e: 'ہ' };
      return mapping[labelEn] || 'الف';
    };

    // If it's a long question (hasParts), we do NOT render the standard section heading bar!
    const shouldRenderHeading = showPartHeadings && !sec.hasParts;

    return (
      <section key={sec.id} data-section-category={sec.category} className="relative print:break-inside-auto mb-2" style={{ marginBottom: `${questionGap}px` }}>
        {shouldRenderHeading && (
          /* ── Section heading bar (only for short questions / objective) ── */
          <table className="w-full border-collapse mb-1" style={{ fontSize: `${englishFontSize}px` }}>
            <tbody>
              <tr className={headingHasBorder(sec.category) ? 'border-t border-b border-black' : 'border-t-0 border-b-0'}>
                {/* Marks column on left */}
                {showQuestionMarks && (
                  <td className="border-r border-black text-center font-black align-middle py-0.5 pr-2 pl-1" style={{ width: '28px', fontSize: `${sectionHeaderSize}px` }}>
                    {sectionMarks > 0 ? sectionMarks : ''}
                  </td>
                )}
                {/* Q number + English instruction */}
                <td className="py-0.5 pl-2 align-top">
                  <span className="font-black mr-1" style={{ fontSize: `${sectionHeaderSize}px` }}>{qNum}.</span>
                  <span className="font-bold italic whitespace-pre-line" style={{ fontSize: `${englishFontSize}px` }}>
                    {(languageMode === 'Bilingual' || languageMode === 'English') ? engInstruction : ''}
                  </span>
                </td>
                {/* Urdu instruction (right side) */}
                {(languageMode === 'Bilingual' || languageMode === 'Urdu') && (
                  <td dir="rtl" className="py-0.5 pr-2 text-right align-top font-urdu font-bold whitespace-pre-line" style={{ fontSize: `${urduFontSize}px`, minWidth: '160px' }}>
                    {urInstruction}
                  </td>
                )}
                {/* Repeat Marks column on far right if Urdu is showing */}
              </tr>
            </tbody>
          </table>
        )}

        {/* ── Sub-questions / Parts list ── */}
        <table className="w-full border-collapse" style={{ fontSize: `${englishFontSize}px` }}>
          <tbody>
            {secQuestions.map((q, idx) => {
              const showEn = showEnglish && q.text && (q.medium !== 'Urdu' || languageMode === 'English');
              const showUr = showUrdu && q.textUrdu;

              // Generated long-question parts carry their main-question index in the id.
              // This keeps 8 configured items with 2 parts as Q3(a), Q3(b), Q4(a), Q4(b).
              const generatedPartMatch = q.id.match(/_q(\d+)_part_([a-z])_/i);
              const mainQuestionIndex = generatedPartMatch ? Math.max(1, parseInt(generatedPartMatch[1], 10)) : Math.floor(idx / Math.max(1, sec.longPartCount || (sec.parts || []).length || 1)) + 1;
              const mainQuestionNumber = sec.hasParts ? qNum + mainQuestionIndex - 1 : qNum;
              const partIndex = generatedPartMatch ? Math.max(0, generatedPartMatch[2].toLowerCase().charCodeAt(0) - 97) : idx % Math.max(1, sec.longPartCount || (sec.parts || []).length || 1);

              // Compute labels depending on whether the section uses parts (a/b) or sub-questions (i/ii/iii)
              let subNumEn = '';
              let subNumUr = '';

              if (hasInternalChoice) {
                // Alternatives share one parent question number and have no sub-labels.
                if (!q.isInternalChoiceAlternative) {
                  subNumEn = `${qNum}. `;
                  subNumUr = `${qNum}. `;
                }
              } else if (sec.hasParts) {
                const labelEn = generatedPartMatch ? generatedPartMatch[2].toLowerCase() : getPartLabelEn(q.id, idx);
                const labelUr = getPartLabelUr(labelEn);
                // Subpart format:
                // If first part, show question number then part: 1. (a) or (a), and Urdu (الف) 1. or (الف)
                if (partIndex === 0) {
                  subNumEn = `${mainQuestionNumber}. (${labelEn}) `;
                  subNumUr = `(${labelUr}) ${mainQuestionNumber}.`;
                } else {
                  subNumEn = `     (${labelEn}) `;
                  subNumUr = `(${labelUr})     `;
                }
              } else {
                const subNum = sec.subQuestionNumbering === 'Roman'
                  ? `(${romanNums[idx] || idx + 1})`
                  : `(${idx + 1})`;
                subNumEn = `${subNum} `;
                subNumUr = `${subNum} `;
              }

              // Strip labels from question texts to avoid double-labeling
              const cleanedTextEn = sec.hasParts ? cleanPartText(q.text) : q.text;
              const cleanedTextUr = sec.hasParts ? cleanPartText(q.textUrdu) : q.textUrdu;

              const isFirstPartOfMainQuestion = sec.hasParts && partIndex === 0;
              const showRepeatedStatement = sec.showQuestionStatement === true && isFirstPartOfMainQuestion;
              return (
                <React.Fragment key={q.id}>
                  {showRepeatedStatement && (
                    <tr className="break-inside-avoid">
                      <td colSpan={(showQuestionMarks ? 1 : 0) + (showUr ? 3 : 2)} className="py-1 border-b border-slate-300">
                        <div className="flex justify-between gap-4 italic font-bold">
                          {(languageMode === 'English' || languageMode === 'Bilingual') && <span>{sec.instruction || paper.longQuestionInstruction}</span>}
                          {(languageMode === 'Urdu' || languageMode === 'Bilingual') && <span dir="rtl" className="font-urdu text-right">{sec.instructionUrdu || paper.longQuestionInstructionUrdu}</span>}
                        </div>
                      </td>
                    </tr>
                  )}
                  {/* Scheme-configured alternative questions are separated with OR / یا. */}
                  {hasInternalChoice && q.isInternalChoiceAlternative && (
                    <tr className="break-inside-avoid">
                      {/* Left space for marks */}
                      {showQuestionMarks && q.marks > 0 && <td className="border-r border-black" style={{ width: '28px' }}></td>}
                      <td colSpan={showUr ? 3 : 2} className="text-center py-2 font-black text-sm uppercase tracking-widest">
                        <div className="flex justify-center items-center gap-10">
                          <span className="font-bold border border-black px-2 py-0.5 rounded">OR</span>
                          <span className="font-urdu font-black border border-black px-2 py-0.5 rounded" dir="rtl">یا</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  <tr className="break-inside-avoid relative group/q align-top">
                    {/* Marks left column (per question / part) */}
                    {showQuestionMarks && q.marks > 0 && (
                      <td className="text-center font-black border-r border-black pr-1 pl-0.5 align-top" style={{ width: '28px', fontSize: `${englishFontSize - 1}px`, paddingTop: '3px' }}>
                        {q.marks}
                      </td>
                    )}

                    {/* Sub-number / part label + English text */}
                    <td className="pl-1 pr-1 align-top" style={{ paddingTop: '3px' }}>
                      {showEnglish && subNumEn && <span className="font-black mr-1" style={{ fontSize: `${englishFontSize}px` }}>{subNumEn}</span>}
                      {showEn && (
                        <span className="question-content">
                          {isManualEdit
                            ? <span contentEditable suppressContentEditableWarning className="outline-none bg-amber-50 rounded border-dashed border border-amber-300 p-0.5">{cleanedTextEn}</span>
                            : <MathRenderer text={cleanedTextEn} inline className="leading-snug font-bold" />}
                        </span>
                      )}
                      {/* Image (below English text) */}
                      {q.imageUrl && (
                        <div className="my-1 flex justify-center">
                          <ResizableImage src={q.imageUrl} alt="Diagram" initialDims={{ w: (q as any).imageWidth, h: (q as any).imageHeight, x: (q as any).imageX || 0, y: (q as any).imageY || 0 }} isEditing={isManualEdit} onUpdate={d => updateQuestionImageDims(q.id, d)} />
                        </div>
                      )}
                      {/* MCQ options below English question */}
                      {isMCQType(q.type) && (languageMode === 'Bilingual' || languageMode === 'English') && (
                        <div className="grid mt-1" style={{ gridTemplateColumns: `repeat(${mcqColumns}, minmax(0, 1fr))`, columnGap: `${verticalSpacing * 2}px`, rowGap: `${verticalSpacing}px` }}>
                          {getMcqOptions(q).map((_, i) => {
                            const opt = q.options?.[i] || '';
                            const isCorrect = showAnswersInline && opt === q.correctAnswer;
                            return (
                              <div key={i} className="flex gap-1 items-start min-w-0">
                                <span style={{ fontSize: `${optionLabelSize}px` }} className={`font-black shrink-0 ${isCorrect ? 'text-green-700' : 'text-slate-500'}`}>({String.fromCharCode(65 + i)})</span>
                                <MathRenderer text={opt} className={`font-medium whitespace-normal break-words ${isCorrect ? 'font-bold text-green-700' : ''}`} inline />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Urdu text column */}
                    {showUr && (
                      <td dir="rtl" className="text-right pl-1 pr-1 font-urdu align-top font-bold" style={{ fontSize: `${urduFontSize}px`, fontFamily: urduFont, paddingTop: '3px', minWidth: '120px' }}>
                        <span className="question-content">
                          {isManualEdit
                            ? <span contentEditable suppressContentEditableWarning className="outline-none bg-amber-50 rounded border-dashed border border-amber-300 p-0.5">{cleanedTextUr}</span>
                            : <MathRenderer text={cleanedTextUr!} inline />}
                        </span>
                        {/* MCQ Urdu options */}
                        {isMCQType(q.type) && (languageMode === 'Bilingual' || languageMode === 'Urdu') && (
                          <div dir="rtl" className="grid mt-1" style={{ gridTemplateColumns: `repeat(${mcqColumns}, minmax(0, 1fr))`, columnGap: `${verticalSpacing * 2}px`, rowGap: `${verticalSpacing}px` }}>
                            {getMcqOptions(q).map((_, i) => {
                              const optUrdu = q.optionsUrdu?.[i] || '';
                              const isCorrect = showAnswersInline && optUrdu === q.correctAnswerUrdu && optUrdu !== '';
                              return (
                                <div key={i} className="flex gap-1 items-start min-w-0 flex-row-reverse">
                                  <span style={{ fontSize: `${optionLabelSize}px` }} className={`font-black shrink-0 ${isCorrect ? 'text-green-700' : 'text-slate-500'}`}>({String.fromCharCode(65 + i)})</span>
                                  <MathRenderer text={optUrdu} className={`font-medium whitespace-normal break-words ${isCorrect ? 'font-bold text-green-700' : ''}`} inline />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Urdu numbering is kept in its own RTL cell so it cannot appear on the English side. */}
                    {showUrdu && (
                      <td dir="rtl" className="text-right font-black pl-0.5 pr-0.5 align-top font-urdu" style={{ width: '32px', fontSize: `${englishFontSize}px`, paddingTop: '3px' }}>
                        {subNumUr}
                      </td>
                    )}

                    {isManualEdit && (
                      <td className="print:hidden align-top" style={{ width: '28px' }}>
                        <button onClick={() => removeQuestion(q.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                      </td>
                    )}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </section>
    );
  }

  function renderSection(sec: PaperSectionConfig, secQuestions: Question[], questionNumber?: number) {
    return (
      <section key={sec.id} data-section-category={sec.category} className="relative print:break-inside-auto mb-4" style={{ marginBottom: `${questionGap}px` }}>
        {showPartHeadings && (
          <>
            {/* ── Section title bar ── */}
            <div className={`flex justify-between items-start gap-4 ${headingBorderClass(sec.category)} mb-2 pb-1 relative group break-inside-avoid`}>
              {isManualEdit && <button onClick={() => removeSection(sec.id)} className="absolute -left-8 top-1 p-1 bg-red-500 text-white rounded-md z-20 shadow-lg print:hidden opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"><Trash2 size={12} /></button>}

              {/* Question number and English statement share one heading line. */}
              <h3 style={{ fontSize: `${sectionHeaderSize}px`, fontWeight: 900 }} className="flex min-w-0 items-baseline gap-2 outline-none">
                <span className="shrink-0 uppercase tracking-tighter">{questionNumber ? `Q-${questionNumber}` : sec.title.replace(/^\s*Q\s*[.\-]?\s*\d+\s*/i, '')}</span>
                {(languageMode === 'Bilingual' || languageMode === 'English') && (
                  <span contentEditable={isManualEdit} suppressContentEditableWarning={true} className="font-bold italic normal-case tracking-normal whitespace-pre-line">
                    {sec.instruction || getDefaultSectionInstruction(sec.questionType, sec.selectCount, sec.totalCount)}
                  </span>
                )}
              </h3>

              {/* Right: Attempt count + marks */}
              <div className="flex flex-col items-end justify-center gap-0.5 shrink-0 pl-4">
                {/* Attempt counts */}
                {sec.totalCount > 0 && sec.selectCount !== sec.totalCount && (
                  <span className="text-[9px] font-black text-black uppercase tracking-tight leading-none">
                    Attempt {sec.selectCount} out of {sec.totalCount}
                  </span>
                )}
                {/* Marks badge */}
                {showQuestionMarks && sec.marksPerQuestion > 0 && (
                  <span className="text-[9px] font-black text-black uppercase tracking-tight leading-none">
                    {sec.marksPerQuestion} × {sec.selectCount} = {sec.marksPerQuestion * sec.selectCount} Marks
                  </span>
                )}
              </div>
            </div>

            {/* Urdu statement remains on its RTL line below the bilingual heading. */}
            <div className="mb-3 break-inside-avoid space-y-0.5">
              {(languageMode === 'Bilingual' || languageMode === 'Urdu') && (
                <p dir="rtl" style={{ fontSize: `${urduFontSize}px` }} contentEditable={isManualEdit} suppressContentEditableWarning={true} className="font-urdu text-right font-bold text-black outline-none leading-[1.8] whitespace-pre-line">
                  {sec.instructionUrdu || getDefaultSectionInstructionUrdu(sec.questionType, sec.selectCount, sec.totalCount)}
                </p>
              )}
            </div>
          </>
        )}

        {isGridView ? (
          /* TABLE GRID MODE */
          <table className="w-full border-collapse border-2 border-black text-left">
            <thead className="bg-slate-100 border-b-2 border-black">
              <tr className="font-black text-[10px] uppercase tracking-widest">
                <th className="border-r-2 border-black p-2 w-10 text-center">SR.</th>
                <th className="p-2">{boardExamFormat ? 'QUESTION / سوال' : 'ITEM DESCRIPTION / CONTENT'}</th>
                {showQuestionMarks && <th className="border-l-2 border-black p-2 w-14 text-center">MARKS</th>}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {secQuestions.map((q, idx) => (
                <tr key={q.id} className="break-inside-avoid relative group/row">
                  <td style={{ padding: `${tableDensity}px` }} className="border-r-2 border-black align-top text-center font-black">
                    {sec.subQuestionNumbering === 'Roman' ? `(${ROMAN_NUMS[idx] || idx + 1})` : `${idx + 1}.`}
                    {isManualEdit && (
                      <button onClick={() => removeQuestion(q.id)} className="absolute -left-10 top-2 p-1 text-red-500 hover:bg-red-50 rounded print:hidden opacity-0 group-row:opacity-100"><Trash2 size={14} /></button>
                    )}
                  </td>
                  <td style={{ padding: `${tableDensity}px` }} className="p-2 align-top">
                    <div className="space-y-2">
                      {(languageMode === 'Bilingual' || languageMode === 'English') && q.text && (q.medium !== 'Urdu' || languageMode === 'English') && (
                        <div className="question-content">
                          {isManualEdit ?
                            <p contentEditable={true} suppressContentEditableWarning={true} className="font-bold leading-relaxed outline-none">{q.text}</p> :
                            <MathRenderer text={q.text} className="font-bold leading-relaxed" />}
                        </div>
                      )}
                      {(languageMode === 'Bilingual' || languageMode === 'Urdu') && q.textUrdu && (
                        <div dir="rtl" style={{ fontSize: `${urduFontSize}px` }} className="font-urdu text-right leading-[1.8] py-1 question-content">
                          {isManualEdit ?
                            <p contentEditable={true} suppressContentEditableWarning={true} className="outline-none">{q.textUrdu}</p> :
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
                      {isMCQType(q.type) && (
                        <div
                          className="grid pt-2 border-t border-slate-100 mt-1"
                          style={{ gridTemplateColumns: `repeat(${mcqColumns}, minmax(0, 1fr))`, gap: `${verticalSpacing}px` }}
                        >
                          {getMcqOptions(q).map((_, i) => {
                            const opt = q.options?.[i] || '';
                            const optUrdu = q.optionsUrdu?.[i] || '';
                            const isCorrect = showAnswersInline && (opt === q.correctAnswer || (optUrdu === q.correctAnswerUrdu && optUrdu !== ''));

                            return (
                              <div key={i} className="flex gap-2 items-start min-w-0">
                                <span style={{ fontSize: `${optionLabelSize}px` }} className={`font-black ${isCorrect ? 'text-green-700' : 'text-slate-400'}`}>({String.fromCharCode(65 + i)})</span>
                                <div className="flex flex-col min-w-0">
                                  {(languageMode === 'Bilingual' || languageMode === 'English') && opt && (q.medium !== 'Urdu' || languageMode === 'English') && (
                                    isManualEdit ?
                                      <span style={{ fontSize: `${optionTextSize}px` }} contentEditable suppressContentEditableWarning={true} className={`font-medium outline-none whitespace-normal break-words ${isCorrect ? 'font-bold text-green-700' : ''}`}>{opt}</span> :
                                      <MathRenderer text={opt} className={`font-medium whitespace-normal break-words ${isCorrect ? 'font-bold underline text-green-700 decoration-green-500' : ''}`} inline />
                                  )}
                                  {(languageMode === 'Bilingual' || languageMode === 'Urdu') && optUrdu && (
                                    <div dir="rtl" style={{ fontSize: `${optionUrduSize}px` }} className={`font-urdu text-right whitespace-normal break-words ${isCorrect ? 'font-bold text-green-700' : ''}`}>
                                      {isManualEdit ? <span contentEditable suppressContentEditableWarning={true} className="outline-none">{optUrdu}</span> : <MathRenderer text={optUrdu} inline />}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {/* Show Answers Logic for Grid View (Only if Inline) */}
                      {showAnswersInline && q.type !== 'MCQ' && (
                        <div className="mt-2 text-sm text-green-700 bg-green-50 p-1 rounded border border-green-200 font-medium">
                          <span className="font-bold">Ans:</span> <MathRenderer text={q.correctAnswer || 'N/A'} inline />
                        </div>
                      )}
                    </div>
                  </td>
                  {showQuestionMarks && (
                    <td style={{ padding: `${tableDensity}px` }} className="border-l-2 border-black align-top text-center font-black">
                      {q.marks > 0 ? q.marks : ''}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* STANDARD LIST MODE */
          <div className={`space-y-4 ${sec.questionsPerLine ? 'grid grid-cols-2 gap-x-8 gap-y-4 space-y-0' : ''}`} style={{ rowGap: `${questionGap}px`, lineHeight }}>
            {secQuestions.map((q, idx) => {
              const cleanStandardPartText = (text: string | undefined) => {
                if (!text || !sec.hasParts) return text || '';
                let cleaned = text.trim();
                for (let pass = 0; pass < 2; pass += 1) {
                  cleaned = cleaned
                    .replace(/^\s*Q\s*[.\-]?\s*\d+\s*(?:[.\-:]\s*)?(?:\(?\s*[a-z]\s*[).:]?\s*)?/i, '')
                    .replace(/^\s*\d+\s*[.\-:]\s*(?:\(?\s*[a-z]\s*[).:]?\s*)/i, '')
                    .replace(/^\s*\d+\s+(?:\(?\s*[a-z]\s*[).:]?\s*)/i, '')
                    .replace(/^\s*\([a-z\u0600-\u06FF]\)\s*/i, '')
                    .trim();
                }
                return cleaned;
              };
              const displayTextEn = cleanStandardPartText(q.text);
              const displayTextUr = cleanStandardPartText(q.textUrdu);
              const showEn = (languageMode === 'Bilingual' || languageMode === 'English') && displayTextEn && (q.medium !== 'Urdu' || languageMode === 'English');
              const showUr = (languageMode === 'Bilingual' || languageMode === 'Urdu') && displayTextUr;
              const isBilingual = showEn && showUr;

              const partCountForDisplay = Math.max(1, sec.longPartCount || (sec.parts || []).length || 1);
              const partLabelEn = ['a', 'b', 'c', 'd', 'e', 'f', 'g'][idx % partCountForDisplay] || 'a';
              const partLabelUrMapping: Record<string, string> = { a: 'الف', b: 'ب', c: 'ج', d: 'د', e: 'ہ' };
              const partLabelUr = partLabelUrMapping[partLabelEn] || 'الف';

              const standardMainNumber = sec.questionNumber || questionNumber || idx + 1;
              const partNumber = sec.hasParts
                ? Math.floor(idx / Math.max(1, sec.longPartCount || (sec.parts || []).length || 1))
                : 0;
              const numEn = sec.hasParts
                ? `${standardMainNumber + partNumber}. ${partLabelEn})`
                : (sec.subQuestionNumbering === 'Roman'
                  ? `(${ROMAN_NUMS[idx] || idx + 1})`
                  : `${idx + 1}.`);

              const numUr = sec.hasParts
                ? `${partLabelUr}) ${standardMainNumber + partNumber}.`
                : (sec.subQuestionNumbering === 'Roman'
                  ? `(${ROMAN_NUMS[idx] || idx + 1})`
                  : `${idx + 1}.`);

              return (
                <div key={q.id} className="relative break-inside-avoid group/q" style={{ marginBottom: `${questionGap}px` }}>
                  {isManualEdit && (
                    <div className="absolute -left-12 top-0 flex flex-col gap-1 print:hidden">
                      <button onClick={() => togglePageBreak(q.id)} className={`p-1.5 rounded transition-colors shadow-sm ${q.pageBreakAfter ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><Scissors size={14} /></button>
                      <button onClick={() => removeQuestion(q.id)} className="p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors shadow-sm"><Trash2 size={14} /></button>
                    </div>
                  )}

                  {sec.hasParts && sec.showQuestionStatement === true && idx % Math.max(1, sec.longPartCount || (sec.parts || []).length || 1) === 0 && (
                    <div className="mb-1 flex justify-between gap-4 border-b border-slate-300 pb-1 italic font-bold">
                      {(languageMode === 'English' || languageMode === 'Bilingual') && <span>{sec.instruction || paper.longQuestionInstruction}</span>}
                      {(languageMode === 'Urdu' || languageMode === 'Bilingual') && <span dir="rtl" className="font-urdu text-right">{sec.instructionUrdu || paper.longQuestionInstructionUrdu}</span>}
                    </div>
                  )}

                  {isBilingual ? (
                    /* BILINGUAL: English on Left, Urdu on Right on Same Line */
                    <div dir="ltr" className="flex justify-between items-start gap-6 w-full">
                      {/* Left: English text */}
                      <div className="flex-1 flex gap-2 items-start text-left">
                        <span className="font-black text-sm min-w-[22px] pt-0.5 text-slate-900 shrink-0">
                          {numEn}
                        </span>
                        <div className="flex-1 space-y-1 question-content">
                          {isManualEdit ? (
                            <p contentEditable suppressContentEditableWarning={true} className="leading-relaxed outline-none bg-amber-50 rounded border-dashed border border-amber-300 p-1 font-bold">{displayTextEn}</p>
                          ) : (
                            <MathRenderer text={displayTextEn} className="leading-relaxed font-bold" />
                          )}
                          {showQuestionMarks && (
                            <span contentEditable={isManualEdit} suppressContentEditableWarning={true} className="text-[10px] font-black text-slate-500 pt-0.5 inline-block">[{q.marks}]</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Urdu text */}
                      <div dir="rtl" style={{ fontFamily: urduFont }} className="flex-1 flex gap-2 items-start text-right font-urdu justify-start min-w-0">
                        <span className="font-black text-sm min-w-[28px] w-[28px] pt-0.5 text-slate-900 shrink-0 text-right" dir="ltr">
                          {numUr}
                        </span>
                        <div className="flex-1 min-w-0 space-y-1 question-content">
                          {isManualEdit ? (
                            <p contentEditable suppressContentEditableWarning={true} style={{ fontSize: `${urduFontSize}px` }} className="bg-amber-50 rounded border-dashed border border-amber-300 p-1 outline-none font-bold text-black leading-[1.8]">{displayTextUr}</p>
                          ) : (
                            <div style={{ fontSize: `${urduFontSize}px` }} className="font-bold text-black leading-[1.8]">
                              <MathRenderer text={displayTextUr} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : showUr ? (
                    /* URDU ONLY: Aligned to Right */
                    <div dir="rtl" style={{ fontFamily: urduFont }} className="flex gap-2 items-start text-right font-urdu w-full justify-start">
                      <span className="font-black text-sm min-w-[22px] pt-0.5 text-slate-900 shrink-0" dir="ltr">
                        {numUr}
                      </span>
                      <div className="flex-1 space-y-1 question-content">
                        <div className="flex justify-between items-start">
                          {isManualEdit ? (
                            <p contentEditable suppressContentEditableWarning={true} style={{ fontSize: `${urduFontSize}px` }} className="bg-amber-50 rounded border-dashed border border-amber-300 p-1 outline-none font-bold text-black leading-[1.8] flex-1">{displayTextUr}</p>
                          ) : (
                            <div style={{ fontSize: `${urduFontSize}px` }} className="font-bold text-black leading-[1.8] flex-1">
                              <MathRenderer text={displayTextUr} />
                            </div>
                          )}
                          {showQuestionMarks && (
                            <span contentEditable={isManualEdit} suppressContentEditableWarning={true} className="text-[10px] font-black text-slate-500 pt-0.5 shrink-0 ml-3">[{q.marks}]</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ENGLISH ONLY: Aligned to Left */
                    <div className="flex gap-2 items-start text-left w-full">
                      <span className="font-black text-sm min-w-[22px] pt-0.5 text-slate-900 shrink-0">
                        {numEn}
                      </span>
                      <div className="flex-1 space-y-1 question-content">
                        <div className="flex justify-between items-start">
                          {isManualEdit ? (
                            <p contentEditable suppressContentEditableWarning={true} className="leading-relaxed outline-none bg-amber-50 rounded border-dashed border border-amber-300 p-1 font-bold flex-1">{displayTextEn}</p>
                          ) : (
                            <MathRenderer text={displayTextEn} className="leading-relaxed font-bold flex-1" />
                          )}
                          {showQuestionMarks && (
                            <span contentEditable={isManualEdit} suppressContentEditableWarning={true} className="text-[10px] font-black text-slate-500 pt-0.5 shrink-0 ml-3">[{q.marks}]</span>
                          )}
                        </div>
                      </div>
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

                  {/* SHOW ANSWER LOGIC FOR LIST VIEW (INLINE) */}
                  {showAnswersInline && (
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

                  {isMCQType(q.type) && (
                    <div
                      className={`grid gap-x-4 mt-2 break-inside-avoid transition-all`}
                      style={{
                        gridTemplateColumns: `repeat(${mcqColumns}, minmax(0, 1fr))`,
                        columnGap: `${verticalSpacing * 2}px`,
                        rowGap: `${verticalSpacing * 2}px`
                      }}
                    >
                      {getMcqOptions(q).map((_, i) => {
                        const opt = q.options?.[i] || '';
                        const optUrdu = q.optionsUrdu?.[i] || '';
                        // Highlight if showing answers
                        const isCorrect = showAnswersInline && (opt === q.correctAnswer || (optUrdu === q.correctAnswerUrdu && optUrdu !== ''));

                        return (
                          <div key={i} className={`flex items-start gap-2 relative ${isCorrect ? 'bg-green-100/50 rounded p-1 -m-1 border border-green-200' : ''}`}>
                            <span style={{ fontSize: `${optionLabelSize}px` }} className={`font-black uppercase shrink-0 pt-0.5 ${isCorrect ? 'text-green-700' : 'text-slate-400'}`}>({String.fromCharCode(65 + i)})</span>
                            <div className={`flex-1 min-w-0 flex ${bilingualInline ? 'flex-row items-baseline gap-2' : 'flex-col gap-0.5'}`}>
                              {(languageMode === 'Bilingual' || languageMode === 'English') && opt && (q.medium !== 'Urdu' || languageMode === 'English') && (
                                isManualEdit ?
                                  <span style={{ fontSize: `${optionTextSize}px` }} contentEditable suppressContentEditableWarning={true} className="font-medium text-slate-800 outline-none whitespace-normal break-words">{opt}</span> :
                                  <MathRenderer text={opt} className={`font-medium whitespace-normal break-words ${isCorrect ? 'text-green-900 font-bold' : 'text-slate-800'}`} />
                              )}
                              {(languageMode === 'Bilingual' || languageMode === 'Urdu') && optUrdu && (
                                <div dir="rtl" style={{ fontSize: `${optionUrduSize}px` }} className={`font-urdu text-right whitespace-normal break-words ${isCorrect ? 'text-green-900 font-bold' : 'text-black'} ${bilingualInline ? 'leading-none' : 'mt-0.5'}`}>
                                  {isManualEdit ?
                                    <span contentEditable suppressContentEditableWarning={true} className="outline-none">{optUrdu}</span> :
                                    <MathRenderer text={optUrdu} />
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
                                <span className="font-bold text-xs w-5 shrink-0">({i + 1})</span>
                                <div className={`flex-1 flex ${bilingualInline ? 'flex-col gap-1' : 'flex-col'}`}>
                                  {(languageMode === 'Bilingual' || languageMode === 'English') && pair.left && (q.medium !== 'Urdu' || languageMode === 'English') &&
                                    (isManualEdit ? <span contentEditable suppressContentEditableWarning={true} className="text-xs font-bold leading-tight outline-none">{pair.left}</span> : <MathRenderer text={pair.left} className="text-xs font-bold leading-tight" />)
                                  }
                                  {(languageMode === 'Bilingual' || languageMode === 'Urdu') && pair.leftUrdu &&
                                    <div className="font-urdu text-right mt-1 leading-tight text-sm" dir="rtl">
                                      {isManualEdit ? <span contentEditable suppressContentEditableWarning={true} className="outline-none">{pair.leftUrdu}</span> : <MathRenderer text={pair.leftUrdu} />}
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
                              .sort((a, b) => (showAnswersInline ? 0 : (a.right || '').localeCompare(b.right || ''))) // If showing answers, don't shuffle (or show matched)
                              .map((pair, i) => (
                                <div key={`right-${i}`} className={`p-3 flex gap-3 items-center min-h-[40px] ${showAnswersInline ? 'bg-green-50' : ''}`}>
                                  <span style={{ fontSize: `${optionLabelSize}px` }} className="font-black w-5 shrink-0">({String.fromCharCode(65 + i)})</span>
                                  <div className={`flex-1 flex ${bilingualInline ? 'flex-col gap-1' : 'flex-col'}`}>
                                    {(languageMode === 'Bilingual' || languageMode === 'English') && pair.right && (q.medium !== 'Urdu' || languageMode === 'English') &&
                                      (isManualEdit ? <span contentEditable suppressContentEditableWarning={true} className="text-xs font-bold leading-tight outline-none">{pair.right}</span> : <MathRenderer text={pair.right} className="text-xs font-bold leading-tight" />)
                                    }
                                    {(languageMode === 'Bilingual' || languageMode === 'Urdu') && pair.rightUrdu &&
                                      <div className="font-urdu text-right mt-1 leading-tight text-sm" dir="rtl">
                                        {isManualEdit ? <span contentEditable suppressContentEditableWarning={true} className="outline-none">{pair.rightUrdu}</span> : <MathRenderer text={pair.rightUrdu} />}
                                      </div>
                                    }
                                  </div>
                                  {showAnswersInline && <span className="text-[9px] font-bold text-green-600 border border-green-300 px-1 rounded">Matches ({i + 1})</span>}
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {q.pageBreakAfter && (
                    <div className="page-break relative print:hidden h-8 flex items-center justify-center">
                      <div className="w-full border-t-2 border-dashed border-indigo-400 opacity-50"></div>
                      <div className="absolute bg-indigo-600 text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
                        <Scissors size={10} /> Manual Page Break
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }
};

export default PrintPreview;
