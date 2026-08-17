import React, { useState, useEffect, useMemo } from 'react';
import { getTeacherSubmissions, getClasses, getSubjects, getPapersBySchool, getSyllabuses, getStudents, getPlans, getSchoolById, deleteSubmission, deletePaperSubmissions } from '../../services/dataService';
import { ExamSubmission, ClassLevel, Subject, SavedPaper, User, Student, Syllabus } from '../../types';
import { Search, Filter, Download, FileSpreadsheet, Calendar, BookOpen, GraduationCap, ArrowRight, ChevronDown, CheckCircle, Clock, X, Printer, AlertCircle, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ResultCenterProps {
  user: User;
}

const ResultCenter: React.FC<ResultCenterProps> = ({ user }) => {
  const [isOnlineTestEnabled, setIsOnlineTestEnabled] = useState<boolean | null>(null);
  const planHasOnlineTest = (features: any) =>
    Array.isArray(features) && features.some((f: any) => {
      const s = String(f || '').toLowerCase();
      return s.includes('online') && (s.includes('test') || s.includes('exam'));
    });
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [papers, setPapers] = useState<SavedPaper[]>([]);
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Mode
  const [filterMode, setFilterMode] = useState<'WIZARD' | 'DROPDOWN'>('WIZARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSyllabus, setSelectedSyllabus] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedPaper, setSelectedPaper] = useState('ALL');
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (user.schoolId) {
        const [school, plans] = await Promise.all([getSchoolById(user.schoolId), getPlans()]);
        const plan = plans.find((p: any) => p.name === school?.subscriptionPlan);
        const enabled = planHasOnlineTest(plan?.features);
        setIsOnlineTestEnabled(!!enabled);
        if (!enabled) {
          setLoading(false);
          return;
        }
      } else {
        setIsOnlineTestEnabled(true);
      }

      const [subs, cls, subsj, paps, syls, stus] = await Promise.all([
        getTeacherSubmissions({ pageSize: 1000 }),
        getClasses(),
        getSubjects(),
        getPapersBySchool(user.schoolId || ''),
        getSyllabuses(),
        getStudents({ pageSize: 1000 }) 
      ]);
      setSubmissions(subs);
      setClasses(cls);
      setSubjects(subsj);
      setPapers(paps);
      setSyllabuses(syls);
      
      // If getStudents returns { data: [] } pagination object vs array
      setStudents(Array.isArray(stus) ? stus : (stus as any).data || []);
    } catch (err) {
      console.error("Failed to load result center data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isOnlineTestEnabled === false) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="p-10 bg-gray-50 border-b border-gray-200 text-center">
            <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
            <h2 className="text-2xl font-black text-gray-900">Result Center Restricted</h2>
            <p className="text-gray-600 mt-2 text-sm leading-relaxed max-w-xl mx-auto">
              Your current package does not include the <strong>Online Test</strong> feature. Online submissions and result analytics are disabled.
            </p>
          </div>
          <div className="p-8 text-center">
            <p className="text-sm text-gray-700 font-medium">Please upgrade your package to enable Online Testing.</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine View Mode & Active Data
  const viewMode = useMemo(() => {
      if (selectedStudentId || searchTerm) {
          const term = searchTerm.toLowerCase();
          const studentMatches = students.filter(s => s.name.toLowerCase().includes(term) || s.rollNo?.toLowerCase().includes(term));
          if (studentMatches.length > 0) return 'STUDENT_VIEW';
      }
      
      if (selectedClass !== 'ALL' && selectedPaper === 'ALL') return 'CLASS_SUMMARY';
      
      return 'TEST_VIEW';
  }, [searchTerm, students, selectedClass, selectedPaper]);

  // STUDENT VIEW DATA
  const studentViewData = useMemo(() => {
      if (viewMode !== 'STUDENT_VIEW') return null;
      const term = searchTerm.toLowerCase();
      const matchedStudent = selectedStudentId
        ? students.find(s => s.id === selectedStudentId)
        : students.find(s => s.name.toLowerCase().includes(term) || s.rollNo?.toLowerCase().includes(term));
      if (!matchedStudent) return null;

      const studentSubs = submissions.filter(s => s.studentId === matchedStudent.id);
      
      // Find papers assigned to this student's class
      const sanitize = (s: string) => (s || '').toLowerCase().replace(/class|grade|year|\s+/g, '');
      const studentClass = classes.find(c => c.id === matchedStudent.classId);
      const assignedPapers = papers.filter(p => sanitize(p.classLevel) === sanitize(studentClass?.name ?? ''));

      // Subject Filter logic for the student view
      const displaySubmissions = selectedSubject === 'ALL' 
        ? studentSubs 
        : studentSubs.filter(s => (s.paper as any)?.subject === selectedSubject);
      
      const displayPapers = selectedSubject === 'ALL'
        ? assignedPapers
        : assignedPapers.filter(p => p.subject === selectedSubject);

      // Calculate Stats (Based on ALL assigned papers vs Attempted)
      const attemptedCount = studentSubs.length;
      const totalCount = assignedPapers.length;
      const absentCount = Math.max(0, totalCount - attemptedCount);

      const attemptedObtained = studentSubs.reduce((acc, s) => acc + s.totalScore, 0);
      const attemptedTotalMarks = studentSubs.reduce((acc, s) => acc + ((s.paper as any)?.totalMarks || 0), 0);
      
      const overallTotalMarks = assignedPapers.reduce((acc, p) => acc + (p.totalMarks || 0), 0);

      const attemptedAvg = attemptedCount > 0 ? attemptedObtained / attemptedCount : 0;
      const overallAvg = totalCount > 0 ? attemptedObtained / totalCount : 0;

      const attemptedPct = attemptedTotalMarks > 0 ? (attemptedObtained / attemptedTotalMarks) * 100 : 0;
      const overallPct = overallTotalMarks > 0 ? (attemptedObtained / overallTotalMarks) * 100 : 0;

      return {
          student: matchedStudent,
          tests: studentSubs,
          assignedPapers,
          displaySubmissions,
          displayPapers,
          stats: {
              attemptedCount,
              totalCount,
              absentCount,
              attemptedObtained,
              attemptedTotalMarks,
              overallTotalMarks,
              attemptedAvg,
              overallAvg,
              attemptedPct,
              overallPct
          }
      };
  }, [viewMode, searchTerm, selectedStudentId, students, submissions, papers, classes, selectedSubject]);

  // Filter Cascade Options
  const availableClasses = useMemo(() => {
      return selectedSyllabus === 'ALL' 
        ? classes 
        : classes.filter(c => c.syllabusId === selectedSyllabus);
  }, [classes, selectedSyllabus]);

  const availableSubjects = useMemo(() => {
      let classId = selectedClass;
      if (viewMode === 'STUDENT_VIEW' && studentViewData) {
          classId = studentViewData.student.classId;
      }
      return classId === 'ALL' 
        ? subjects 
        : subjects.filter(s => s.classId === classId);
  }, [subjects, selectedClass, viewMode, studentViewData]);

  const availablePapers = useMemo(() => {
      return papers.filter(p => {
          const matchClass = selectedClass === 'ALL' || p.classLevel.toLowerCase() === classes.find(c => c.id === selectedClass)?.name?.toLowerCase();
          const matchSubject = selectedSubject === 'ALL' || p.subject.toLowerCase() === selectedSubject.toLowerCase();
          
          const examDate = new Date(p.examDate || p.dateCreated);
          const examDateOnly = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate()).getTime();

          let matchDateFrom = true;
          if (dateFrom) {
              const df = new Date(dateFrom);
              matchDateFrom = examDateOnly >= new Date(df.getFullYear(), df.getMonth(), df.getDate()).getTime();
          }

          let matchDateTo = true;
          if (dateTo) {
              const dt = new Date(dateTo);
              matchDateTo = examDateOnly <= new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
          }

          return matchClass && matchSubject && matchDateFrom && matchDateTo;
      });
  }, [papers, selectedClass, selectedSubject, dateFrom, dateTo, classes]);


  // CLASS SUMMARY DATA
  const classSummaryData = useMemo(() => {
      if (viewMode !== 'CLASS_SUMMARY') return null;
      
      const targetClass = classes.find(c => c.id === selectedClass);
      if (!targetClass) return null;

      // Filter papers for this class
      const sanitize = (s: string) => (s || '').toLowerCase().replace(/class|grade|year|\s+/g, '');
      const classPapers = papers.filter(p => sanitize(p.classLevel) === sanitize(targetClass.name));
      
      // Further filter by subject/date if set
      const filteredPapers = classPapers.filter(p => {
          const matchSubject = selectedSubject === 'ALL' || p.subject.toLowerCase() === selectedSubject.toLowerCase();
          
          const examDate = new Date(p.examDate || p.dateCreated);
          const examDateOnly = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate()).getTime();

          let matchDateFrom = true;
          if (dateFrom) {
              const df = new Date(dateFrom);
              matchDateFrom = examDateOnly >= new Date(df.getFullYear(), df.getMonth(), df.getDate()).getTime();
          }

          let matchDateTo = true;
          if (dateTo) {
              const dt = new Date(dateTo);
              matchDateTo = examDateOnly <= new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
          }

          return matchSubject && matchDateFrom && matchDateTo;
      });

      const testsWithStats = filteredPapers.map(paper => {
          const paperSubs = submissions.filter(s => s.paperId === paper.id);
          const totalObtained = paperSubs.reduce((acc, s) => acc + s.totalScore, 0);
          const avgScore = paperSubs.length > 0 ? totalObtained / paperSubs.length : 0;
          const avgPct = (avgScore / (paper.totalMarks || 1)) * 100;

          return {
              paper,
              stats: {
                  submissionCount: paperSubs.length,
                  avgScore,
                  avgPct
              }
          };
      });

      return {
          class: targetClass,
          tests: testsWithStats
      };
  }, [viewMode, selectedClass, classes, papers, selectedSubject, dateFrom, dateTo, submissions]);


  // TEST VIEW DATA
  const activePaperData = useMemo(() => {
      if (viewMode !== 'TEST_VIEW') return null;
      
      let targetPaperId = selectedPaper;
      
      // If no paper selected, auto-pick latest available
      if (targetPaperId === 'ALL') {
          if (availablePapers.length > 0) {
              const sorted = [...availablePapers].sort((a, b) => new Date(b.examDate || b.dateCreated).getTime() - new Date(a.examDate || a.dateCreated).getTime());
              targetPaperId = sorted[0].id;
          } else {
              return null; // No papers match
          }
      }

      const paper = papers.find(p => p.id === targetPaperId);
      if (!paper) return null;

      // All submissions for this specific paper
      const paperSubs = submissions.filter(s => s.paperId === paper.id);
      const submittedStudentIds = new Set(paperSubs.map(s => s.studentId));

      // Attempt to find the target class by name robustly to get "Pending" students
      const sanitize = (s: string) => (s || '').toLowerCase().replace(/class|grade|year|\s+/g, '');
      const paperClass = classes.find(c => sanitize(c.name) === sanitize(paper.classLevel));

      // Include students who submitted OR belong to the class
      const targetStudents = students.filter(s => {
          if (submittedStudentIds.has(s.id)) return true;
          if (paperClass && s.classId === paperClass.id) return true;
          return false;
      });
      
      const mappedResults = targetStudents.map(student => {
          const submission = paperSubs.find(s => s.studentId === student.id);
          return {
              student,
              submission
          };
      });

      return {
          paper,
          results: mappedResults
      };

  }, [viewMode, selectedPaper, availablePapers, papers, classes, students, submissions]);


  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const schoolName = user.school?.name || 'Academic Institution';
    const dateStr = new Date().toLocaleDateString();

    // 1. Multi-test cumulative report PDF export
    if (selectedPaperIds.length > 0 || (viewMode === 'CLASS_SUMMARY' && classSummaryData)) {
      const activePapersList = selectedPaperIds.length > 0 
        ? papers.filter(p => selectedPaperIds.includes(p.id))
        : (classSummaryData ? classSummaryData.tests.map(t => t.paper) : []);

      if (activePapersList.length > 0) {
        const sanitize = (s: string) => (s || '').toLowerCase().replace(/class|grade|year|\s+/g, '');
        const targetClassName = activePapersList[0].classLevel;
        const targetClass = classes.find(c => sanitize(c.name) === sanitize(targetClassName));
        const classStudents = students.filter(s => targetClass && s.classId === targetClass.id);

        doc.setFontSize(18);
        doc.setTextColor(0, 168, 107);
        doc.text(schoolName.toUpperCase(), 14, 15);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Multi-Test Cumulative Academic Performance Report - Class ${targetClassName}`, 14, 22);
        doc.text(`Generated: ${dateStr} | Selected Tests: ${activePapersList.length}`, 14, 27);

        const tableHeaders = [
          'Roll No',
          'Student Name',
          ...activePapersList.map(p => `${p.title}\n(${p.subject})`),
          'Total Obtained',
          'Grand Max',
          'Percentage'
        ];

        const tableRows = classStudents.map(student => {
          let grandObtained = 0;
          let grandMaxMarks = 0;
          const scores = activePapersList.map(p => {
            const sub = submissions.find(s => s.studentId === student.id && s.paperId === p.id);
            const score = sub ? sub.totalScore : 0;
            const maxM = p.totalMarks || 0;
            grandObtained += score;
            grandMaxMarks += maxM;
            return sub ? `${score} / ${maxM}` : 'ABSENT';
          });

          const pct = grandMaxMarks > 0 ? ((grandObtained / grandMaxMarks) * 100).toFixed(1) + '%' : '0%';
          return [
            student.rollNo || 'N/A',
            student.name,
            ...scores,
            String(grandObtained),
            String(grandMaxMarks),
            pct
          ];
        });

        autoTable(doc, {
          startY: 32,
          head: [tableHeaders],
          body: tableRows,
          theme: 'grid',
          headStyles: { fillColor: [0, 168, 107], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
          styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
          columnStyles: { 0: { halign: 'left' }, 1: { halign: 'left', fontStyle: 'bold' } }
        });

        doc.save(`Class_${targetClassName.replace(/\s+/g, '_')}_Cumulative_Result_Report.pdf`);
        return;
      }
    }

    // 2. Class Single-Test PDF report export
    if (viewMode === 'TEST_VIEW' && activePaperData) {
      doc.setFontSize(16);
      doc.setTextColor(0, 168, 107);
      doc.text(schoolName.toUpperCase(), 14, 15);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Test Result Report: ${activePaperData.paper.title}`, 14, 22);
      doc.text(`Subject: ${activePaperData.paper.subject} | Class: ${activePaperData.paper.classLevel} | Max Marks: ${activePaperData.paper.totalMarks} | Date: ${new Date(activePaperData.paper.examDate || activePaperData.paper.dateCreated).toLocaleDateString()}`, 14, 27);

      const tableHeaders = ['Student Name', 'Roll Number', 'Obtained Score', 'Max Marks', 'Percentage', 'Status'];
      const tableRows = activePaperData.results.map(r => {
        const hasSub = !!r.submission;
        const score = hasSub ? r.submission!.totalScore : 0;
        const maxM = activePaperData.paper.totalMarks || 1;
        const pct = hasSub ? ((score / maxM) * 100).toFixed(1) + '%' : '0%';
        const status = !hasSub ? 'Absent' : r.submission!.isGraded ? 'Graded' : 'In Review';
        return [r.student.name, r.student.rollNo || 'N/A', String(score), String(maxM), pct, status];
      });

      autoTable(doc, {
        startY: 32,
        head: [tableHeaders],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 }
      });

      doc.save(`${activePaperData.paper.title.replace(/\s+/g, '_')}_Result_Report.pdf`);
      return;
    }

    // 3. Student Individual PDF Report
    if (viewMode === 'STUDENT_VIEW' && studentViewData) {
      doc.setFontSize(16);
      doc.setTextColor(0, 168, 107);
      doc.text(schoolName.toUpperCase(), 14, 15);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Student Academic Card: ${studentViewData.student.name} (Roll No: ${studentViewData.student.rollNo || 'N/A'})`, 14, 22);
      doc.text(`Attempted Avg: ${studentViewData.stats.attemptedAvg.toFixed(1)} | Attempted Pct: ${studentViewData.stats.attemptedPct.toFixed(1)}% | Overall Pct: ${studentViewData.stats.overallPct.toFixed(1)}%`, 14, 27);

      const tableHeaders = ['Assessment Title', 'Subject', 'Date', 'Obtained Score', 'Max Marks', 'Percentage', 'Status'];
      const tableRows = studentViewData.displayPapers.map(paper => {
        const test = studentViewData.tests.find(t => t.paperId === paper.id);
        const hasAttempted = !!test;
        const score = hasAttempted ? test.totalScore : 0;
        const maxM = paper.totalMarks || 1;
        const pct = hasAttempted ? ((score / maxM) * 100).toFixed(1) + '%' : '0%';
        return [
          paper.title,
          paper.subject,
          new Date(paper.examDate || paper.dateCreated).toLocaleDateString(),
          String(score),
          String(maxM),
          pct,
          !hasAttempted ? 'Absent' : test.isGraded ? 'Graded' : 'In Review'
        ];
      });

      autoTable(doc, {
        startY: 32,
        head: [tableHeaders],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [0, 168, 107], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 }
      });

      doc.save(`${studentViewData.student.name.replace(/\s+/g, '_')}_Academic_Report.pdf`);
      return;
    }

    // Default browser print fallback
    window.print();
  };

  const handleExport = () => {
    // Multi-test selection or full class cumulative report
    if (selectedPaperIds.length > 0 || (viewMode === 'CLASS_SUMMARY' && classSummaryData)) {
      const activePapersList = selectedPaperIds.length > 0 
        ? papers.filter(p => selectedPaperIds.includes(p.id))
        : (classSummaryData ? classSummaryData.tests.map(t => t.paper) : []);

      if (activePapersList.length > 0) {
        const sanitize = (s: string) => (s || '').toLowerCase().replace(/class|grade|year|\s+/g, '');
        const targetClassName = activePapersList[0].classLevel;
        const targetClass = classes.find(c => sanitize(c.name) === sanitize(targetClassName));
        const classStudents = students.filter(s => targetClass && s.classId === targetClass.id);

        const data = classStudents.map(student => {
          let grandObtained = 0;
          let grandMaxMarks = 0;
          const rowData: any = {
            RollNumber: student.rollNo || 'N/A',
            StudentName: student.name,
            Class: targetClassName
          };

          activePapersList.forEach(p => {
            const sub = submissions.find(s => s.studentId === student.id && s.paperId === p.id);
            const score = sub ? sub.totalScore : 0;
            const maxM = p.totalMarks || 0;
            grandObtained += score;
            grandMaxMarks += maxM;

            rowData[`Test: ${p.title} (${p.subject})`] = sub ? `${score} / ${maxM}` : 'ABSENT';
          });

          const totalPct = grandMaxMarks > 0 ? ((grandObtained / grandMaxMarks) * 100).toFixed(2) + '%' : '0%';
          rowData['Total Marks Obtained'] = grandObtained;
          rowData['Grand Total Marks'] = grandMaxMarks;
          rowData['Overall Percentage'] = totalPct;

          return rowData;
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Full_Class_Report");
        XLSX.writeFile(wb, `Class_${targetClassName.replace(/\s+/g, '_')}_Full_Result_Report.xlsx`);
        return;
      }
    }

    if (viewMode === 'TEST_VIEW' && activePaperData) {
        const data = activePaperData.results.map(r => ({
            StudentName: r.student.name,
            RollNumber: r.student.rollNo,
            ExamTitle: activePaperData.paper.title,
            Score: r.submission?.totalScore || 0,
            MaxMarks: activePaperData.paper.totalMarks,
            Percentage: r.submission ? (((r.submission.totalScore) / (activePaperData.paper.totalMarks || 1)) * 100).toFixed(2) + '%' : '0%',
            Status: !r.submission ? 'Absent/Pending' : r.submission.isGraded ? 'Graded' : 'In Review',
            SubmittedAt: r.submission ? new Date(r.submission.submittedAt).toLocaleString() : 'N/A'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Class_Results");
        XLSX.writeFile(wb, `${activePaperData.paper.title.replace(/\s+/g, '_')}_Results.xlsx`);
    } else if (viewMode === 'STUDENT_VIEW' && studentViewData) {
        const data = studentViewData.displayPapers.map(paper => {
            const test = studentViewData.tests.find(t => t.paperId === paper.id);
            return {
                ExamTitle: paper.title,
                Subject: paper.subject,
                Score: test?.totalScore || 0,
                MaxMarks: paper.totalMarks,
                Percentage: test ? (((test.totalScore) / (paper.totalMarks || 1)) * 100).toFixed(2) + '%' : '0% (Absent)',
                Status: !test ? 'Absent' : test.isGraded ? 'Graded' : 'In Review',
                Date: new Date(paper.examDate || paper.dateCreated).toLocaleDateString()
            };
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Student_Report");
        XLSX.writeFile(wb, `${studentViewData.student.name.replace(/\s+/g, '_')}_Report.xlsx`);
    } else if (viewMode === 'CLASS_SUMMARY' && classSummaryData) {
        const data = classSummaryData.tests.map(item => ({
            Date: new Date(item.paper.examDate || item.paper.dateCreated).toLocaleDateString(),
            Subject: item.paper.subject,
            TestTitle: item.paper.title,
            AvgScore: item.stats.avgScore.toFixed(2),
            MaxMarks: item.paper.totalMarks,
            ClassAvgPercentage: item.stats.avgPct.toFixed(2) + '%',
            Submissions: item.stats.submissionCount
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Class_Summary");
        XLSX.writeFile(wb, `${classSummaryData.class.name.replace(/\s+/g, '_')}_Summary.xlsx`);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 print:p-0 print:space-y-4 print:max-w-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 15mm; }
          .print-card { 
            border: 2px solid #0f172a; 
            border-radius: 1rem; 
            padding: 2rem;
            height: auto;
            min-height: 250mm;
          }
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}} />
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden print:hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h1 className="text-4xl font-black tracking-tight mb-2">Result Center</h1>
                <p className="text-indigo-200 font-medium">Search students for individual reports or filter classes for aggregate results.</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={handleDownloadPDF}
                    className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all shadow-xl active:scale-95"
                >
                    <Download size={18} />
                    Download PDF Report
                </button>
                <button 
                    onClick={handleExport}
                    className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-indigo-50 transition-all shadow-xl active:scale-95"
                >
                    <Download size={18} />
                    {viewMode === 'CLASS_SUMMARY' ? 'Download Class Summary' : viewMode === 'TEST_VIEW' ? 'Download Class Results' : 'Download Student Report'}
                </button>
            </div>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Print-only professional header */}
      <div className="hidden print:block mb-8 border-b-4 border-slate-900 pb-6 text-slate-900">
         <div className="flex justify-between items-end mb-8">
            <div className="flex items-center gap-4">
                {user.school?.logo && <img src={user.school.logo} alt="School Logo" className="w-16 h-16 object-contain" />}
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">{user.school?.name || 'Academic Institution'}</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Academic Assessment Report</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generated On</p>
                <p className="font-bold">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            </div>
         </div>

         {selectedPaperIds.length > 0 && (
            <div className="mb-6 p-6 bg-emerald-50 rounded-3xl border border-emerald-200 text-slate-900">
                <h3 className="font-black text-emerald-800 text-lg uppercase tracking-tight mb-2">Multi-Test Comprehensive Performance Report</h3>
                <p className="text-xs font-bold text-emerald-700">Includes {selectedPaperIds.length} Selected Tests: {papers.filter(p => selectedPaperIds.includes(p.id)).map(p => `${p.title} (${p.subject})`).join(', ')}</p>
            </div>
         )}

         {selectedPaperIds.length === 0 && viewMode === 'TEST_VIEW' && activePaperData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Title</p>
                    <p className="font-bold text-lg">{activePaperData.paper.title}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject & Class</p>
                    <p className="font-bold text-lg">{activePaperData.paper.subject} • {activePaperData.paper.classLevel}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Date</p>
                    <p className="font-bold text-lg">{new Date(activePaperData.paper.examDate || activePaperData.paper.dateCreated).toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Marks</p>
                    <p className="font-bold text-lg">{activePaperData.paper.totalMarks}</p>
                </div>
            </div>
         )}

         {viewMode === 'STUDENT_VIEW' && studentViewData && (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Student Name</p>
                        <p className="font-bold text-lg">{studentViewData.student.name}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Roll Number</p>
                        <p className="font-bold text-lg">{studentViewData.student.rollNo || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Academic Class</p>
                        <p className="font-bold text-lg">{classes.find(c => c.id === studentViewData.student.classId)?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Tests</p>
                        <p className="font-bold text-lg">{studentViewData.stats.totalCount}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Avg (Attempted)</p>
                        <p className="text-xl font-black text-indigo-600">{studentViewData.stats.attemptedAvg.toFixed(1)}</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Avg (Overall)</p>
                        <p className="text-xl font-black text-slate-500">{studentViewData.stats.overallAvg.toFixed(1)}</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Percentage (Attempted)</p>
                        <p className="text-xl font-black text-emerald-600">{studentViewData.stats.attemptedPct.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Percentage (Overall)</p>
                        <p className="text-xl font-black text-rose-600">{studentViewData.stats.overallPct.toFixed(1)}%</p>
                    </div>
                </div>
            </div>
         )}

         {viewMode === 'CLASS_SUMMARY' && classSummaryData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-slate-900 text-white rounded-3xl">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Overview</p>
                    <p className="font-bold text-lg">{classSummaryData.class.name}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tests Tracked</p>
                    <p className="font-bold text-lg">{classSummaryData.tests.length}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Performance</p>
                    <p className="font-bold text-lg">
                        {(classSummaryData.tests.reduce((acc, t) => acc + t.stats.avgPct, 0) / (classSummaryData.tests.length || 1)).toFixed(1)}%
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Subject</p>
                    <p className="font-bold text-lg">{selectedSubject === 'ALL' ? 'Multi-Subject' : selectedSubject}</p>
                </div>
            </div>
         )}
      </div>

      {/* Filter Mode Switch & Navigation (Mirrors Exam Grading) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:hidden">
        {/* Top Control Bar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
            {filterMode === 'WIZARD' ? (
              <div className="flex items-center gap-2 text-xs font-bold">
                  <button 
                      onClick={() => { setSelectedSyllabus('ALL'); setSelectedClass('ALL'); setSelectedSubject('ALL'); setSelectedPaper('ALL'); }}
                      className={`px-3 py-1.5 rounded-lg transition-all ${selectedSyllabus === 'ALL' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200/60 text-slate-600 hover:bg-slate-300/60'}`}
                  >
                      1. Board
                  </button>
                  <ChevronDown className="-rotate-90 text-slate-400" size={14} />
                  <button 
                      disabled={selectedSyllabus === 'ALL'}
                      onClick={() => { setSelectedClass('ALL'); setSelectedSubject('ALL'); setSelectedPaper('ALL'); }}
                      className={`px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 ${selectedClass === 'ALL' && selectedSyllabus !== 'ALL' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200/60 text-slate-600 hover:bg-slate-300/60'}`}
                  >
                      2. Class
                  </button>
                  <ChevronDown className="-rotate-90 text-slate-400" size={14} />
                  <button 
                      disabled={selectedClass === 'ALL'}
                      onClick={() => { setSelectedSubject('ALL'); setSelectedPaper('ALL'); }}
                      className={`px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 ${selectedSubject === 'ALL' && selectedClass !== 'ALL' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200/60 text-slate-600 hover:bg-slate-300/60'}`}
                  >
                      3. Subject
                  </button>
                  <ChevronDown className="-rotate-90 text-slate-400" size={14} />
                  <button 
                      disabled={selectedSubject === 'ALL'}
                      onClick={() => { setSelectedPaper('ALL'); }}
                      className={`px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 ${selectedPaper === 'ALL' && selectedSubject !== 'ALL' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200/60 text-slate-600 hover:bg-slate-300/60'}`}
                  >
                      4. Test / Exam
                  </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Filter size={16} className="text-emerald-600" /> Standard Dropdown Filters Active
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Filter Mode Toggle Button */}
              <button 
                onClick={() => setFilterMode(m => m === 'WIZARD' ? 'DROPDOWN' : 'WIZARD')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all"
              >
                <Filter size={14} className="text-emerald-600" />
                {filterMode === 'WIZARD' ? 'Switch to Classic Dropdowns' : 'Switch to Step Wizard'}
              </button>

              {/* Quick Search */}
              <div className="relative min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                      type="text" 
                      className="w-full pl-9 pr-8 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-xs"
                      placeholder="Search student or roll no..."
                      value={searchTerm}
                      onChange={e => { setSelectedStudentId(''); setSearchTerm(e.target.value); }}
                  />
                  {searchTerm && (
                      <button onClick={() => { setSearchTerm(''); setSelectedStudentId(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          <X size={14} />
                      </button>
                  )}
              </div>
            </div>
        </div>

        {/* Dropdown Mode View */}
        {filterMode === 'DROPDOWN' && (
          <div className="p-6 bg-slate-50/40 border-b border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Syllabus / Board</label>
                      <select 
                          className="w-full px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-xs"
                          value={selectedSyllabus}
                          onChange={e => { setSelectedSyllabus(e.target.value); setSelectedClass('ALL'); setSelectedSubject('ALL'); setSelectedPaper('ALL'); }}
                      >
                          <option value="ALL" className="bg-white text-slate-800">All Boards</option>
                          {syllabuses.map(s => <option key={s.id} value={s.id} className="bg-white text-slate-800">{s.name}</option>)}
                      </select>
                  </div>

                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class / Grade</label>
                      <select 
                          className="w-full px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-xs"
                          value={selectedClass}
                          onChange={e => { setSelectedClass(e.target.value); setSelectedSubject('ALL'); setSelectedPaper('ALL'); }}
                      >
                          <option value="ALL" className="bg-white text-slate-800">All Classes</option>
                          {availableClasses.map(c => <option key={c.id} value={c.id} className="bg-white text-slate-800">{c.name}</option>)}
                      </select>
                  </div>

                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Filter</label>
                      <select 
                          className="w-full px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-xs"
                          value={selectedSubject}
                          onChange={e => { setSelectedSubject(e.target.value); setSelectedPaper('ALL'); }}
                      >
                          <option value="ALL" className="bg-white text-slate-800">All Subjects</option>
                          {availableSubjects.map(s => <option key={s.id} value={s.name} className="bg-white text-slate-800">{s.name}</option>)}
                      </select>
                  </div>

                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specific Test</label>
                      <select 
                          className="w-full px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-xs"
                          value={selectedPaper}
                          onChange={e => setSelectedPaper(e.target.value)}
                      >
                          <option value="ALL" className="bg-white text-slate-800">Latest / Auto</option>
                          {availablePapers.map(p => <option key={p.id} value={p.id} className="bg-white text-slate-800">{new Date(p.examDate || p.dateCreated).toLocaleDateString()} — {p.subject} — {p.title}</option>)}
                      </select>
                  </div>
              </div>
          </div>
        )}

        {/* Wizard Mode View */}
        {filterMode === 'WIZARD' && (
          <div className="p-6">
              {/* STEP 1: SELECT BOARD */}
              {selectedSyllabus === 'ALL' && !searchTerm && (
                  <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Step 1: Select Educational Board</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {syllabuses.map(s => (
                              <button
                                  key={s.id}
                                  onClick={() => { setSelectedSyllabus(s.id); setSelectedClass('ALL'); setSelectedSubject('ALL'); setSelectedPaper('ALL'); }}
                                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-lg transition-all text-left group"
                              >
                                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                      {s.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{s.description || 'Click to view classes'}</p>
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              {/* STEP 2: SELECT CLASS */}
              {selectedSyllabus !== 'ALL' && selectedClass === 'ALL' && !searchTerm && (
                  <div className="space-y-4">
                      <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Step 2: Select Grade / Class</h3>
                          <button onClick={() => setSelectedSyllabus('ALL')} className="text-xs text-emerald-600 font-bold hover:underline">Change Board</button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {availableClasses.map(c => (
                              <button
                                  key={c.id}
                                  onClick={() => { setSelectedClass(c.id); setSelectedSubject('ALL'); setSelectedPaper('ALL'); }}
                                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-lg transition-all text-left group"
                              >
                                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                      {c.name.substring(0, 3)}
                                  </div>
                                  <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>
                                  <p className="text-[11px] text-slate-400 mt-1">Select class to view subjects</p>
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              {/* STEP 3: SELECT SUBJECT */}
              {selectedClass !== 'ALL' && selectedSubject === 'ALL' && !searchTerm && (
                  <div className="space-y-4">
                      <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Step 3: Select Subject</h3>
                          <button onClick={() => setSelectedClass('ALL')} className="text-xs text-emerald-600 font-bold hover:underline">Change Class</button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {availableSubjects.map(s => (
                              <button
                                  key={s.id}
                                  onClick={() => { setSelectedSubject(s.name); setSelectedPaper('ALL'); }}
                                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-lg transition-all text-left group"
                              >
                                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                      {s.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                                  <p className="text-[11px] text-slate-400 mt-1">Select subject to view tests</p>
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              {/* STEP 4: SELECT TEST & DATE FILTER */}
              {selectedSubject !== 'ALL' && !searchTerm && (
                  <div className="space-y-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-slate-100">
                          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Step 4: Select Exam / Test</h3>
                          <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 text-xs">
                                  <Calendar size={14} className="text-slate-400" />
                                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold" />
                                  <span>to</span>
                                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold" />
                              </div>
                              <button onClick={() => setSelectedSubject('ALL')} className="text-xs text-emerald-600 font-bold hover:underline">Change Subject</button>
                          </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {availablePapers.map(p => (
                              <button
                                  key={p.id}
                                  onClick={() => setSelectedPaper(p.id)}
                                  className={`p-5 rounded-2xl border text-left transition-all ${
                                      (selectedPaper === p.id || (!selectedPaper && activePaperData?.paper.id === p.id))
                                          ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-1 ring-emerald-600'
                                          : 'border-slate-200 bg-white hover:border-emerald-400'
                                  }`}
                              >
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{p.subject}</span>
                                      <span className="text-xs text-slate-400 font-bold">{new Date(p.examDate || p.dateCreated).toLocaleDateString()}</span>
                                  </div>
                                  <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{p.title}</h4>
                                  <p className="text-xs text-slate-500 mt-1">{p.totalMarks || 100} Marks • Class {p.classLevel}</p>
                              </button>
                          ))}
                      </div>
                  </div>
              )}
          </div>
        )}

        {/* Multi-Test Selector Bar */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Multi-Test Select (For Cumulative PDF & Excel Reports)</label>
              {selectedPaperIds.length > 0 && (
                <button onClick={() => setSelectedPaperIds([])} className="text-xs text-rose-500 font-bold hover:underline">Clear Selection ({selectedPaperIds.length})</button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 bg-white border border-slate-200 rounded-xl">
              {availablePapers.map(p => {
                const isChecked = selectedPaperIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (isChecked) setSelectedPaperIds(selectedPaperIds.filter(id => id !== p.id));
                      else setSelectedPaperIds([...selectedPaperIds, p.id]);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${isChecked ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
                  >
                    {isChecked ? '✓ ' : '+ '} {p.title} ({p.subject})
                  </button>
                );
              })}
              {availablePapers.length === 0 && <span className="text-xs text-slate-400 italic">No tests match current selection</span>}
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
          <div className="p-32 flex flex-col items-center print:hidden">
              <div className="w-16 h-16 border-4 border-slate-900 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Assembling Records...</p>
          </div>
      ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
              {selectedPaperIds.length > 0 ? (
                  /* MULTI-TEST CUMULATIVE PDF & SCREEN REPORT MODE */
                  <div className="p-8">
                      <div className="mb-6 p-6 bg-slate-900 text-white rounded-3xl flex items-center justify-between">
                          <div>
                              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Cumulative Report View</span>
                              <h2 className="text-xl font-black mt-1">Multi-Test Result Summary ({selectedPaperIds.length} Selected Tests)</h2>
                              <p className="text-xs text-slate-400 mt-1">Total score obtained, maximum marks, and overall percentage calculated across all selected tests.</p>
                          </div>
                          <button onClick={handleExport} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md print:hidden flex items-center gap-2">
                              <Download size={14} /> Export Excel
                          </button>
                      </div>

                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 print:bg-transparent">
                                      <th className="px-6 py-4">Roll No</th>
                                      <th className="px-6 py-4">Student Name</th>
                                      {papers.filter(p => selectedPaperIds.includes(p.id)).map(p => (
                                          <th key={p.id} className="px-4 py-4 text-center">{p.title} ({p.subject})</th>
                                      ))}
                                      <th className="px-6 py-4 text-center bg-emerald-50/50">Total Obtained</th>
                                      <th className="px-6 py-4 text-center bg-emerald-50/50">Grand Max</th>
                                      <th className="px-6 py-4 text-center bg-emerald-50/50">Percentage</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {(() => {
                                      const activePapersList = papers.filter(p => selectedPaperIds.includes(p.id));
                                      if (activePapersList.length === 0) return null;
                                      const sanitize = (s: string) => (s || '').toLowerCase().replace(/class|grade|year|\s+/g, '');
                                      const targetClassName = activePapersList[0].classLevel;
                                      const targetClass = classes.find(c => sanitize(c.name) === sanitize(targetClassName));
                                      const classStudents = students.filter(s => targetClass && s.classId === targetClass.id);

                                      return classStudents.map(student => {
                                          let grandObtained = 0;
                                          let grandMaxMarks = 0;

                                          return (
                                              <tr key={student.id} className="hover:bg-slate-50">
                                                  <td className="px-6 py-4 text-sm font-bold text-slate-600">{student.rollNo || 'N/A'}</td>
                                                  <td className="px-6 py-4 font-bold text-slate-900">{student.name}</td>
                                                  {activePapersList.map(p => {
                                                      const sub = submissions.find(s => s.studentId === student.id && s.paperId === p.id);
                                                      const score = sub ? sub.totalScore : 0;
                                                      const maxM = p.totalMarks || 0;
                                                      grandObtained += score;
                                                      grandMaxMarks += maxM;
                                                      return (
                                                          <td key={p.id} className="px-4 py-4 text-center text-xs font-bold">
                                                              {sub ? (
                                                                  <span className="text-slate-800">{score} <span className="text-[10px] text-slate-400">/ {maxM}</span></span>
                                                              ) : (
                                                                  <span className="text-rose-500 text-[10px] uppercase font-black">Absent</span>
                                                              )}
                                                          </td>
                                                      );
                                                  })}
                                                  <td className="px-6 py-4 text-center font-black text-emerald-600 text-sm bg-emerald-50/20">{grandObtained}</td>
                                                  <td className="px-6 py-4 text-center font-bold text-slate-500 text-sm bg-emerald-50/20">{grandMaxMarks}</td>
                                                  <td className="px-6 py-4 text-center bg-emerald-50/20">
                                                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                                          (grandObtained / (grandMaxMarks || 1)) >= 0.8 ? 'bg-emerald-100 text-emerald-800' : (grandObtained / (grandMaxMarks || 1)) >= 0.5 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                                      }`}>
                                                          {grandMaxMarks > 0 ? ((grandObtained / grandMaxMarks) * 100).toFixed(1) + '%' : '0%'}
                                                      </span>
                                                  </td>
                                              </tr>
                                          );
                                      });
                                  })()}
                              </tbody>
                          </table>
                      </div>
                  </div>
              ) : viewMode === 'STUDENT_VIEW' && studentViewData ? (
                  /* STUDENT VIEW MODE */
                  <div className="print-card">
                      <div className="p-8 border-b border-slate-100 bg-indigo-50/30 print:p-0 print:border-b-2 print:border-slate-900 print:mb-8">
                           <div className="flex items-center gap-6">
                               <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg print:border print:border-slate-300 print:text-indigo-600 print:bg-white">
                                   {studentViewData.student.name.charAt(0)}
                               </div>
                               <div className="flex-1">
                                   <h2 className="text-2xl font-black text-slate-900">{studentViewData.student.name}</h2>
                                   <div className="flex gap-4 mt-1 text-sm font-bold text-slate-500">
                                       <span>Roll No: {studentViewData.student.rollNo || 'N/A'}</span>
                                       <span>•</span>
                                       <span>Class: {classes.find(c => c.id === studentViewData.student.classId)?.name}</span>
                                   </div>
                               </div>
                               <div className="hidden md:grid grid-cols-4 gap-3 print:grid">
                                   {[
                                       { label: 'Obtained', value: studentViewData.stats.attemptedObtained, sub: `out of ${studentViewData.stats.overallTotalMarks}`, color: 'indigo' },
                                       { label: 'Attempted %', value: `${studentViewData.stats.attemptedPct.toFixed(1)}%`, sub: 'Exclude Absents', color: 'emerald' },
                                       { label: 'Overall %', value: `${studentViewData.stats.overallPct.toFixed(1)}%`, sub: 'Include Absents', color: 'rose' },
                                       { label: 'Status', value: `${studentViewData.stats.attemptedCount}/${studentViewData.stats.totalCount}`, sub: 'Tests Taken', color: 'slate' }
                                   ].map((s, i) => (
                                       <div key={i} className="px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm min-w-[120px]">
                                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{s.label}</p>
                                           <p className={`text-sm font-black text-${s.color}-600 leading-none`}>{s.value}</p>
                                           <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">{s.sub}</p>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       </div>

                      {studentViewData.displayPapers.length === 0 ? (
                          <div className="p-20 text-center text-slate-400 print:hidden">
                              <p className="font-bold">No tests recorded for this selection.</p>
                          </div>
                      ) : (
                          <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                  <thead>
                                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 print:bg-transparent">
                                          <th className="px-8 py-5">Date</th>
                                          <th className="px-8 py-5">Subject</th>
                                          <th className="px-8 py-5">Assessment</th>
                                          <th className="px-8 py-5 text-center">Score</th>
                                          <th className="px-8 py-5 text-center">Marks %</th>
                                          <th className="px-8 py-5">Result Status</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {studentViewData.displayPapers.sort((a,b) => new Date(b.examDate || b.dateCreated).getTime() - new Date(a.examDate || a.dateCreated).getTime()).map(paper => {
                                          const test = studentViewData.tests.find(t => t.paperId === paper.id);
                                          const hasAttempted = !!test;
                                          const pct = hasAttempted ? (test.totalScore / (paper.totalMarks || 1)) * 100 : 0;
                                          return (
                                              <tr key={paper.id} className={`hover:bg-slate-50 ${!hasAttempted ? 'bg-rose-50/20' : ''}`}>
                                                  <td className="px-8 py-5 text-sm font-bold text-slate-600">
                                                      {new Date(paper.examDate || paper.dateCreated).toLocaleDateString()}
                                                  </td>
                                                  <td className="px-8 py-5">
                                                      <span className="font-bold text-slate-900">{paper.subject}</span>
                                                  </td>
                                                  <td className="px-8 py-5 text-sm font-bold text-slate-600">
                                                      {paper.title}
                                                  </td>
                                                  <td className="px-8 py-5 text-center">
                                                      {hasAttempted ? (
                                                          <span className={`text-lg font-black ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                              {test.totalScore} <span className="text-[10px] text-slate-400">/ {paper.totalMarks}</span>
                                                          </span>
                                                      ) : (
                                                          <span className="text-sm font-black text-rose-500">ABSENT</span>
                                                      )}
                                                  </td>
                                                  <td className="px-8 py-5 text-center">
                                                      {hasAttempted ? (
                                                          <span className="text-xs font-black text-slate-400 uppercase">{pct.toFixed(1)}%</span>
                                                      ) : (
                                                          <span className="text-xs font-black text-rose-300 uppercase">0%</span>
                                                      )}
                                                  </td>
                                                  <td className="px-8 py-5">
                                                      {!hasAttempted ? (
                                                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-700 border border-rose-200">
                                                              Missed
                                                          </span>
                                                      ) : (
                                                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${test.isGraded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                              {test.isGraded ? 'Finalized' : 'In Review'}
                                                          </span>
                                                      )}
                                                  </td>
                                              </tr>
                                          );
                                      })}
                                  </tbody>
                              </table>
                          </div>
                      )}
                  </div>
              ) : viewMode === 'CLASS_SUMMARY' && classSummaryData ? (
                   /* CLASS SUMMARY MODE */
                   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="p-8 border-b border-slate-100 bg-slate-900 text-white print:p-0 print:border-b-2 print:border-slate-900 print:mb-8 print:text-slate-900">
                           <h2 className="text-2xl font-black">{classSummaryData.class.name} - Academic Summary</h2>
                           <p className="text-slate-400 font-bold text-sm mt-1">Showing all tests conducted for this class within selected filters.</p>
                       </div>

                       {classSummaryData.tests.length === 0 ? (
                           <div className="p-20 text-center text-slate-400">
                               <p className="font-bold">No tests found for this class.</p>
                           </div>
                       ) : (
                           <div className="overflow-x-auto">
                               <table className="w-full text-left border-collapse">
                                   <thead>
                                       <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                           <th className="px-8 py-5">Date</th>
                                           <th className="px-8 py-5">Subject</th>
                                           <th className="px-8 py-5">Test Title</th>
                                           <th className="px-8 py-5 text-center">Avg Score</th>
                                           <th className="px-8 py-5 text-center">Class Performance</th>
                                           <th className="px-8 py-5 text-right">Action</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                       {classSummaryData.tests.sort((a,b) => new Date(b.paper.examDate || b.paper.dateCreated).getTime() - new Date(a.paper.examDate || a.paper.dateCreated).getTime()).map(item => (
                                           <tr key={item.paper.id} className="hover:bg-slate-50 transition-colors">
                                               <td className="px-8 py-5 text-sm font-bold text-slate-600">
                                                   {new Date(item.paper.examDate || item.paper.dateCreated).toLocaleDateString()}
                                               </td>
                                               <td className="px-8 py-5">
                                                   <span className="font-bold text-slate-900">{item.paper.subject}</span>
                                               </td>
                                               <td className="px-8 py-5 text-sm font-bold text-slate-600">
                                                   {item.paper.title}
                                               </td>
                                               <td className="px-8 py-5 text-center font-black text-slate-700">
                                                   {item.stats.avgScore.toFixed(1)} <span className="text-[10px] text-slate-400">/ {item.paper.totalMarks}</span>
                                               </td>
                                               <td className="px-8 py-5 text-center">
                                                   <div className="flex items-center justify-center gap-2">
                                                       <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                                                           <div className={`h-full rounded-full transition-all duration-1000 ${item.stats.avgPct >= 80 ? 'bg-emerald-500' : item.stats.avgPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${item.stats.avgPct}%` }}></div>
                                                       </div>
                                                       <span className={`text-xs font-black ${item.stats.avgPct >= 80 ? 'text-emerald-600' : item.stats.avgPct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                           {item.stats.avgPct.toFixed(1)}%
                                                       </span>
                                                   </div>
                                               </td>
                                               <td className="px-8 py-5 text-right">
                                                   <button 
                                                       onClick={() => setSelectedPaper(item.paper.id)}
                                                       className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                                                   >
                                                       View Details
                                                   </button>
                                               </td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                       )}
                  </div>
               ) : viewMode === 'TEST_VIEW' && activePaperData ? (
                  /* TEST VIEW MODE */
                  <div>
                      <div className="mx-6 mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
                          <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Class test result</p>
                              <p className="mt-1 text-sm font-bold text-slate-700">The download contains only students from {activePaperData.paper.classLevel} for this selected test.</p>
                          </div>
                          <button onClick={handleExport} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700">
                              <Download size={15} /> Download this class test
                          </button>
                      </div>
                      <div className="p-8 border-b border-slate-100 bg-emerald-50/30 print:p-0 print:border-b-2 print:border-slate-900 print:mb-8 flex justify-between items-start">
                          <div>
                              <h2 className="text-2xl font-black text-slate-900">{activePaperData.paper.title}</h2>
                              <div className="flex flex-wrap gap-4 mt-2 text-sm font-bold text-slate-500">
                                  <span>Subject: {activePaperData.paper.subject}</span>
                                  <span>•</span>
                                  <span>Class: {activePaperData.paper.classLevel}</span>
                                  <span>•</span>
                                  <span>Date: {new Date(activePaperData.paper.examDate || activePaperData.paper.dateCreated).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>Total Marks: {activePaperData.paper.totalMarks}</span>
                              </div>
                          </div>
                          <button
                              onClick={async () => {
                                  if (window.confirm(`Delete ALL results for "${activePaperData.paper.title}"? This will remove all student marks for this paper from student portals.`)) {
                                      await deletePaperSubmissions(activePaperData.paper.id);
                                      await loadData();
                                  }
                              }}
                              className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all print:hidden flex items-center gap-2"
                              title="Delete all student results for this paper"
                          >
                              <Trash2 size={16} /> Clear Paper Results
                          </button>
                      </div>

                      {activePaperData.results.length === 0 ? (
                          <div className="p-20 text-center text-slate-400 print:hidden">
                              <p className="font-bold">No students found in this class.</p>
                          </div>
                      ) : (
                          <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                  <thead>
                                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 print:bg-transparent">
                                          <th className="px-8 py-5">Student Identity</th>
                                          <th className="px-8 py-5">Roll No</th>
                                          <th className="px-8 py-5 text-center">Score</th>
                                          <th className="px-8 py-5">Status</th>
                                          <th className="px-8 py-5 text-right">Action</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {activePaperData.results.map(row => {
                                          const hasSub = !!row.submission;
                                          const pct = hasSub ? (row.submission!.totalScore / (activePaperData.paper.totalMarks || 1)) * 100 : 0;
                                          return (
                                              <tr key={row.student.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedStudentId(row.student.id); setSearchTerm(row.student.rollNo || row.student.name); }}>
                                                  <td className="px-8 py-5">
                                                      <span className="font-bold text-slate-900">{row.student.name}</span>
                                                  </td>
                                                  <td className="px-8 py-5 text-sm font-bold text-slate-600">
                                                      {row.student.rollNo || 'N/A'}
                                                  </td>
                                                  <td className="px-8 py-5 text-center">
                                                      {hasSub ? (
                                                          <div className="inline-flex flex-col">
                                                              <span className={`text-lg font-black ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                                  {row.submission!.totalScore}
                                                              </span>
                                                              <span className="text-[10px] font-black text-slate-400 uppercase">{pct.toFixed(1)}%</span>
                                                          </div>
                                                      ) : (
                                                          <span className="text-slate-300 font-bold">-</span>
                                                      )}
                                                  </td>
                                                  <td className="px-8 py-5">
                                                      {!hasSub ? (
                                                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                              <Clock size={12} /> Pending
                                                          </span>
                                                      ) : row.submission!.isGraded ? (
                                                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                              <CheckCircle size={12} /> Graded
                                                          </span>
                                                      ) : (
                                                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600">
                                                              <Clock size={12} /> In Review
                                                          </span>
                                                      )}
                                                  </td>
                                                  <td className="px-8 py-5 text-right">
                                                       <div className="flex items-center justify-end gap-2">
                                                           <button onClick={(event) => { event.stopPropagation(); setSelectedStudentId(row.student.id); setSearchTerm(row.student.rollNo || row.student.name); }} className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-50">
                                                               Full Report
                                                           </button>
                                                           {hasSub && (
                                                               <button 
                                                                   onClick={async (event) => {
                                                                       event.stopPropagation();
                                                                       if (window.confirm(`Delete test result for ${row.student.name}? This will remove marks from student portal.`)) {
                                                                           await deleteSubmission(row.submission!.id);
                                                                           await loadData();
                                                                       }
                                                                   }}
                                                                   title="Delete Result"
                                                                   className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                               >
                                                                   <Trash2 size={16} />
                                                               </button>
                                                           )}
                                                       </div>
                                                   </td>
                                              </tr>
                                          );
                                      })}
                                  </tbody>
                              </table>
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="p-32 text-center print:hidden">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileSpreadsheet className="text-slate-200" size={40} />
                      </div>
                      <h3 className="text-slate-900 font-bold">No Data Available</h3>
                      <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">Adjust your filters or assign exams to see results.</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default ResultCenter;
