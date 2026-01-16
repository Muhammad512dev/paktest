
import React, { useState } from 'react';
import { Plus, Sparkles, Filter, Search, MoreVertical, Trash2 } from 'lucide-react';
import { Question, QuestionType, Difficulty } from '../types';
import { generateQuestionsAI } from '../services/geminiService';
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
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
            <Plus size={18} />
            Add Manually
          </button>
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
                  <MathRenderer text={q.text} className="text-slate-800 font-medium" />
                  {q.type === QuestionType.MCQ && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {q.options?.map((opt, idx) => (
                        <div key={idx} className={`text-sm px-3 py-1 rounded border flex items-baseline gap-2 ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                           <span>{String.fromCharCode(65+idx)}.</span>
                           <MathRenderer text={opt} inline />
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type !== QuestionType.MCQ && (
                     <div className="mt-2 text-sm text-slate-500">
                       <span className="font-semibold text-slate-700">Answer Key: </span>
                       <MathRenderer text={q.correctAnswer || 'N/A'} inline />
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
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
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
    </div>
  );
};

export default QuestionBank;
