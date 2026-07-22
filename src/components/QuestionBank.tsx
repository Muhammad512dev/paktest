
import React, { useState } from 'react';
import { Plus, Sparkles, Filter, Search, MoreVertical, Trash2, CheckCircle2, FileSpreadsheet, X, Save, Upload } from 'lucide-react';
import { Question, QuestionType, Difficulty } from '../types';
import { generateQuestionsAI } from '../services/geminiService';
import { addQuestionsBulk, addQuestion } from '../services/dataService';
import MathRenderer from './MathRenderer';

interface QuestionBankProps {
  questions: Question[];
  onAddQuestions: (newQuestions: Question[]) => void;
  onDeleteQuestion: (id: string) => void;
}

const QuestionBank: React.FC<QuestionBankProps> = ({ questions, onAddQuestions, onDeleteQuestion }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  
  // Generation State
  const [genSubject, setGenSubject] = useState('Mathematics');
  const [genTopic, setGenTopic] = useState('Algebra');
  const [genCount, setGenCount] = useState(3);
  const [genType, setGenType] = useState<QuestionType>(QuestionType.MCQ);
  const [genDifficulty, setGenDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Manual Add State
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    text: '',
    textUrdu: '',
    type: QuestionType.MCQ,
    subject: 'Mathematics',
    topic: '',
    difficulty: Difficulty.MEDIUM,
    marks: 5,
    options: ['', '', '', ''],
    correctAnswer: ''
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const newQs = await generateQuestionsAI(
        genSubject,
        genTopic,
        genCount,
        genType,
        genDifficulty,
        'Grade 10' // Hardcoded for demo simplicity
      );
      
      // Cast partials to full questions (IDs are added in service)
      onAddQuestions(newQs as Question[]);
      setShowGenModal(false);
    } catch (e) {
      alert("Failed to generate questions. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const questions = Array.isArray(json) ? json : [json];
        await addQuestionsBulk(questions);
        onAddQuestions(questions);
        alert(`Successfully imported ${questions.length} questions.`);
      } catch (err) {
        alert("Invalid JSON file format.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleManualSave = async () => {
    try {
      const saved = await addQuestion(newQuestion);
      onAddQuestions([saved]);
      setShowAddModal(false);
      setNewQuestion({
        text: '',
        textUrdu: '',
        type: QuestionType.MCQ,
        subject: 'Mathematics',
        topic: '',
        difficulty: Difficulty.MEDIUM,
        marks: 5,
        options: ['', '', '', ''],
        correctAnswer: ''
      });
    } catch (e) {
      alert("Failed to save question.");
    }
  };

  const filteredQuestions = questions.filter(q => 
    (filterSubject === 'All' || q.subject === filterSubject) &&
    (q.text.toLowerCase().includes(searchTerm.toLowerCase()) || q.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Question Bank</h1>
          <p className="text-slate-500">Manage and organize your examination questions</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowGenModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Sparkles size={18} />
            AI Generator
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            <Plus size={18} />
            Add Manually
          </button>
          <div className="relative group">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
              onClick={() => document.getElementById('bulk-import')?.click()}
            >
              <FileSpreadsheet size={18} />
              Import JSON
            </button>
            <input 
              id="bulk-import" 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleBulkImport} 
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search questions by text or topic..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
        >
          <option value="All">All Subjects</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Biology">Biology</option>
          <option value="Physics">Physics</option>
          <option value="Chemistry">Chemistry</option>
          <option value="English">English</option>
        </select>
        <button className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600">
          <Filter size={20} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p>No questions found. Try generating some with AI!</p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium 
                      ${q.difficulty === Difficulty.EASY ? 'bg-green-100 text-green-700' : 
                        q.difficulty === Difficulty.MEDIUM ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'}`}>
                      {q.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                      {q.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                      {q.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {q.topic} • {q.marks} Marks
                    </span>
                  </div>
                  <div className="space-y-1">
                    <MathRenderer text={q.text} className="text-slate-800 font-medium" />
                    {q.textUrdu && (
                        <div className="text-right font-urdu text-lg text-slate-600" dir="rtl">
                            <MathRenderer text={q.textUrdu} />
                        </div>
                    )}
                  </div>
                  
                  {q.type === QuestionType.MCQ && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {q.options?.map((opt, idx) => (
                        <div key={idx} className={`text-sm px-3 py-1.5 rounded border flex items-baseline gap-2 ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-800 font-medium ring-1 ring-green-200' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                           <span className="text-xs font-bold text-slate-400">{String.fromCharCode(65+idx)}.</span>
                           <MathRenderer text={opt} inline />
                           {opt === q.correctAnswer && <CheckCircle2 size={14} className="ml-auto text-green-600" />}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Explicit Answer Display for Non-MCQ */}
                  {q.type !== QuestionType.MCQ && (q.correctAnswer || q.correctAnswerUrdu) && (
                     <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100 text-sm text-green-800">
                       <span className="font-bold text-green-900 text-xs uppercase tracking-wider block mb-1">Model Answer / Key:</span>
                       <div className="flex flex-col gap-1">
                           {q.correctAnswer && <MathRenderer text={q.correctAnswer} />}
                           {q.correctAnswerUrdu && <div className="text-right font-urdu" dir="rtl"><MathRenderer text={q.correctAnswerUrdu} /></div>}
                       </div>
                     </div>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                   <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                     <MoreVertical size={18} />
                   </button>
                   <button 
                    onClick={() => onDeleteQuestion(q.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           {/* ... existing Gen Modal ... */}
           <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                    <Sparkles size={18} />
                 </div>
                 <h2 className="text-xl font-bold text-slate-800">Generate Questions</h2>
              </div>
              <button onClick={() => setShowGenModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  value={genSubject}
                  onChange={(e) => setGenSubject(e.target.value)}
                >
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Biology</option>
                  <option>Computer Science</option>
                  <option>English</option>
                  <option>History</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Thermodynamics, Shakespeare, Algebra"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select 
                      className="w-full p-2 border border-slate-300 rounded-lg"
                      value={genType}
                      onChange={(e) => setGenType(e.target.value as QuestionType)}
                    >
                      <option value={QuestionType.MCQ}>MCQ</option>
                      <option value={QuestionType.SHORT}>Short Answer</option>
                      <option value={QuestionType.LONG}>Long Answer</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Count</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      className="w-full p-2 border border-slate-300 rounded-lg"
                      value={genCount}
                      onChange={(e) => setGenCount(parseInt(e.target.value))}
                    />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                <div className="flex gap-2">
                  {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map(d => (
                    <button
                      key={d}
                      onClick={() => setGenDifficulty(d)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        genDifficulty === d 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !genTopic}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate Questions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                      <Plus size={20} />
                   </div>
                   <h2 className="text-xl font-bold text-slate-800">Add Question Manually</h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all"><X size={24}/></button>
             </div>

             <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                      <select 
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                        value={newQuestion.subject}
                        onChange={e => setNewQuestion({...newQuestion, subject: e.target.value})}
                      >
                         <option>Mathematics</option>
                         <option>Physics</option>
                         <option>Chemistry</option>
                         <option>Biology</option>
                         <option>English</option>
                         <option>Computer Science</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Topic</label>
                      <input 
                        type="text" 
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        placeholder="e.g. Differentiation"
                        value={newQuestion.topic}
                        onChange={e => setNewQuestion({...newQuestion, topic: e.target.value})}
                      />
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Question Type</label>
                      <select 
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        value={newQuestion.type}
                        onChange={e => setNewQuestion({...newQuestion, type: e.target.value as QuestionType})}
                      >
                         <option value={QuestionType.MCQ}>MCQ</option>
                         <option value={QuestionType.SHORT}>Short Answer</option>
                         <option value={QuestionType.LONG}>Long Answer</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Difficulty</label>
                      <select 
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        value={newQuestion.difficulty}
                        onChange={e => setNewQuestion({...newQuestion, difficulty: e.target.value as Difficulty})}
                      >
                         <option value={Difficulty.EASY}>Easy</option>
                         <option value={Difficulty.MEDIUM}>Medium</option>
                         <option value={Difficulty.HARD}>Hard</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Marks</label>
                      <input 
                        type="number" 
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        value={newQuestion.marks}
                        onChange={e => setNewQuestion({...newQuestion, marks: parseInt(e.target.value) || 0})}
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Question Text (English)</label>
                   <textarea 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium min-h-[100px]"
                     placeholder="Type your question here..."
                     value={newQuestion.text}
                     onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                   />
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Question Text (Urdu - Optional)</label>
                   <textarea 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-urdu text-xl text-right min-h-[100px]"
                     placeholder="یہاں اپنا سوال ٹائپ کریں۔۔۔"
                     dir="rtl"
                     value={newQuestion.textUrdu}
                     onChange={e => setNewQuestion({...newQuestion, textUrdu: e.target.value})}
                   />
                </div>

                {newQuestion.type === QuestionType.MCQ && (
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Options & Correct Answer</p>
                      <div className="grid grid-cols-2 gap-4">
                         {newQuestion.options?.map((opt, idx) => (
                            <div key={idx} className="relative">
                               <input 
                                 type="text" 
                                 className={`w-full h-12 pl-10 pr-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold ${newQuestion.correctAnswer === opt && opt !== '' ? 'border-emerald-500 ring-2 ring-emerald-50' : 'border-slate-200'}`}
                                 placeholder={`Option ${String.fromCharCode(65+idx)}`}
                                 value={opt}
                                 onChange={e => {
                                    const next = [...(newQuestion.options || [])];
                                    next[idx] = e.target.value;
                                    setNewQuestion({...newQuestion, options: next});
                                 }}
                               />
                               <button 
                                 onClick={() => setNewQuestion({...newQuestion, correctAnswer: opt})}
                                 className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${newQuestion.correctAnswer === opt && opt !== '' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-400'}`}
                               >
                                  {newQuestion.correctAnswer === opt && opt !== '' && <CheckCircle2 size={12}/>}
                               </button>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {newQuestion.type !== QuestionType.MCQ && (
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Model Answer / Key</label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium min-h-[100px]"
                        placeholder="Provide the correct answer or grading key..."
                        value={newQuestion.correctAnswer}
                        onChange={e => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
                      />
                   </div>
                )}
             </div>

             <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 h-12 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Discard</button>
                <button 
                  onClick={handleManualSave}
                  className="flex-[2] h-12 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all"
                >
                   <Save size={20} /> Save to Bank
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
