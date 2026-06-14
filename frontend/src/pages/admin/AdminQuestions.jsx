import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  HelpCircle, Search, Plus, Edit, Trash2, History, Upload, ChevronLeft, ChevronRight, 
  CheckCircle2, AlertTriangle, FileSpreadsheet, X, Layers
} from 'lucide-react';

const AdminQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { id, label }

  // Modals / Panels State
  const [showFormModal, setShowFormModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [historyQuestionText, setHistoryQuestionText] = useState('');
  
  const [formData, setFormData] = useState({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '',
    category: '',
    difficulty: 'easy'
  });

  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/questions', {
        params: { search, category, difficulty }
      });
      setQuestions(response.data);
    } catch (err) {
      setError('Failed to fetch questions database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [category, difficulty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setFormData({
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: '',
      category: '',
      difficulty: 'easy'
    });
    setError('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setFormData({
      question: q.question,
      optionA: q.options[0] || '',
      optionB: q.options[1] || '',
      optionC: q.options[2] || '',
      optionD: q.options[3] || '',
      correctAnswer: q.correctAnswer,
      category: q.category,
      difficulty: q.difficulty
    });
    setError('');
    setShowFormModal(true);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { question, optionA, optionB, optionC, optionD, correctAnswer, category, difficulty } = formData;

    if (!question.trim() || !optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim() || !correctAnswer.trim() || !category.trim()) {
      setError('All fields are required.');
      return;
    }

    const options = [optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim()];
    if (!options.includes(correctAnswer.trim())) {
      setError('Correct Answer must match exactly one of Option A, B, C, or D.');
      return;
    }

    const payload = {
      question: question.trim(),
      options,
      correctAnswer: correctAnswer.trim(),
      category: category.trim(),
      difficulty
    };

    try {
      if (editingQuestion) {
        // Edit / New version
        await api.put(`/questions/${editingQuestion.questionId}`, payload);
      } else {
        // Create
        await api.post('/questions', payload);
      }
      setShowFormModal(false);
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save question.');
    }
  };

  const handleDelete = (id, text) => {
    setPendingDelete({ id, label: text.substring(0, 50) });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setShowDeleteModal(false);
    try {
      await api.delete(`/questions/${pendingDelete.id}`);
      fetchQuestions();
    } catch (err) {
      alert('Failed to delete question.');
    } finally {
      setPendingDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPendingDelete(null);
  };

  const handleViewHistory = async (id, text) => {
    setHistoryQuestionText(text);
    setShowHistoryModal(true);
    setHistoryList([]);
    try {
      const response = await api.get(`/questions/${id}/history`);
      setHistoryList(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    const fileData = new FormData();
    fileData.append('file', uploadFile);

    setUploading(true);
    setUploadSummary(null);
    try {
      const response = await api.post('/questions/import', fileData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSummary(response.data);
      setUploadFile(null);
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed.');
    } finally {
      setUploading(false);
    }
  };

  // Distinct Categories list extracted from database questions
  const categoriesList = [...new Set(questions.map(q => q.category))];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <HelpCircle className="h-7 w-7 text-sky-500" />
            <span>Question Bank</span>
          </h1>
          <p className="text-sm text-slate-450 mt-1">Review test items, audit version edits, and upload spreadsheet questions.</p>
        </div>
        
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={() => { setShowUploadModal(true); setUploadSummary(null); setError(''); }}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-850 border border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm shadow-sm transition"
          >
            <Upload className="h-4 w-4" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm shadow-md transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question texts..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-lg border dark:border-slate-800 text-sm font-semibold">
            Search
          </button>
        </form>

        {/* Dropdowns */}
        <div className="flex gap-2.5">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 px-4 text-slate-700 dark:text-slate-300 focus:outline-none text-sm"
          >
            <option value="">All Categories</option>
            {categoriesList.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 px-4 text-slate-700 dark:text-slate-300 focus:outline-none text-sm"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

      </div>

      {/* Questions Table */}
      <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Question Text</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Difficulty</th>
                <th className="py-4 px-6">Correct Option</th>
                <th className="py-4 px-6 text-center">Version</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
              {loading ? (
                [1, 2, 3, 4].map(n => (
                  <tr key={n}>
                    <td colSpan="6" className="py-4 px-6">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded skeleton-loading"></div>
                    </td>
                  </tr>
                ))
              ) : questions.length > 0 ? (
                questions.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-855/10">
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-white max-w-sm break-words leading-relaxed">{q.question}</td>
                    <td className="py-4 px-6 text-sky-550 dark:text-sky-400 font-medium">{q.category}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full
                        ${q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400' :
                          q.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-650 dark:text-slate-350">{q.correctAnswer}</td>
                    <td className="py-4 px-6 text-center font-mono font-semibold">v{q.version}</td>
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleViewHistory(q.questionId, q.question)}
                        className="p-1.5 rounded bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
                        title="View Edit History"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(q)}
                        className="p-1.5 rounded bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400 hover:text-sky-500 transition"
                        title="Edit question"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(q.questionId, q.question)}
                        className="p-1.5 rounded bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 transition"
                        title="Delete question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-450 font-mono">
                    No questions found in this assessment database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Question Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark w-full max-w-xl rounded-xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            
            <h3 className="text-xl font-bold text-slate-905 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
              {editingQuestion ? `Edit Question v${editingQuestion.version}` : 'Configure New Assessment Question'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-505/10 border border-red-550/25 text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Question text */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Question Text</label>
                <textarea
                  name="question"
                  value={formData.question}
                  onChange={handleChange}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm"
                  required
                />
              </div>

              {/* Options A & B */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Option A</label>
                  <input
                    type="text"
                    name="optionA"
                    value={formData.optionA}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Option B</label>
                  <input
                    type="text"
                    name="optionB"
                    value={formData.optionB}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white text-sm"
                    required
                  />
                </div>
              </div>

              {/* Options C & D */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Option C</label>
                  <input
                    type="text"
                    name="optionC"
                    value={formData.optionC}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Option D</label>
                  <input
                    type="text"
                    name="optionD"
                    value={formData.optionD}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white text-sm"
                    required
                  />
                </div>
              </div>

              {/* Correct Answer */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correct Answer (Must match an option exactly)</label>
                <select
                  name="correctAnswer"
                  value={formData.correctAnswer}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none text-sm"
                  required
                >
                  <option value="">Select correct choice...</option>
                  {formData.optionA && <option value={formData.optionA}>{formData.optionA}</option>}
                  {formData.optionB && <option value={formData.optionB}>{formData.optionB}</option>}
                  {formData.optionC && <option value={formData.optionC}>{formData.optionC}</option>}
                  {formData.optionD && <option value={formData.optionD}>{formData.optionD}</option>}
                </select>
              </div>

              {/* Category & Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Phishing Awareness"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Difficulty</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-5 py-2.5 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-650 dark:text-slate-400 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-semibold shadow-md"
                >
                  Save Question
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* History Side Panel Drawer Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-end z-50 p-0">
          <div className="bg-white dark:bg-cyber-panel-dark h-full w-full max-w-md p-8 shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-slate-200 dark:border-cyber-border-dark animate-slide-in">
            <div>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-sky-505" />
                  <span>Version Auditing</span>
                </h4>
                <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-6">{historyQuestionText}</p>

              {/* Version History timeline */}
              <div className="space-y-6">
                {historyList.length > 0 ? (
                  historyList.map((hist, i) => (
                    <div key={hist._id} className="relative border-l-2 border-slate-100 dark:border-slate-800 pl-4 ml-2 pb-2">
                      <div className="absolute -left-1.5 top-1 h-3.5 w-3.5 rounded-full bg-sky-500 border border-white dark:border-slate-905"></div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white">Version {hist.version} {i === 0 && <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded ml-1.5 uppercase">LATEST ACTIVE</span>}</div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">{hist.question}</p>
                      
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 mt-3 pt-2 border-t border-dashed border-slate-100 dark:border-slate-850">
                        <span>By: <span className="font-semibold">{hist.updatedBy}</span></span>
                        <span>On: {new Date(hist.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-450 font-mono text-xs">Querying versions history...</div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-300 font-semibold rounded text-xs mt-8 transition"
            >
              Close Ledger
            </button>
          </div>
        </div>
      )}

      {/* Excel Question Import Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark w-full max-w-md rounded-xl shadow-2xl p-8">
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-555" />
              <span>Import Excel Questions</span>
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                {error}
              </div>
            )}

            {!uploadSummary ? (
              <form onSubmit={handleImportSubmit} className="space-y-6">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select an Excel Spreadsheet (.xlsx) file. Columns must match exactly: <br />
                  <strong className="text-slate-800 dark:text-slate-250">Question | Option A | Option B | Option C | Option D | Correct Answer | Category | Difficulty</strong>
                </p>

                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-lg text-center bg-slate-50 dark:bg-slate-950/30">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="question-file-picker"
                  />
                  <label 
                    htmlFor="question-file-picker"
                    className="cursor-pointer text-sm font-semibold text-sky-500 hover:text-sky-400 block"
                  >
                    {uploadFile ? uploadFile.name : 'Choose spreadsheet file (.xlsx)'}
                  </label>
                </div>

                <div className="flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-850 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-405 font-medium rounded text-xs hover:bg-slate-50 transition"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={!uploadFile || uploading}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded text-xs shadow-md transition disabled:opacity-50"
                  >
                    {uploading ? 'Processing...' : 'Run Import'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-2.5 p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-505">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase">Import Complete</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded">
                    <span className="text-slate-450 block uppercase text-[10px]">Read Rows</span>
                    <span className="text-lg font-bold">{uploadSummary.totalRows}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded">
                    <span className="text-slate-450 block uppercase text-[10px]">Imported</span>
                    <span className="text-lg font-bold text-emerald-500">{uploadSummary.successCount}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded">
                    <span className="text-slate-450 block uppercase text-[10px]">Failed</span>
                    <span className={`text-lg font-bold ${uploadSummary.failedCount > 0 ? 'text-red-500' : ''}`}>
                      {uploadSummary.failedCount}
                    </span>
                  </div>
                </div>

                {uploadSummary.errors?.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-slate-150 dark:border-slate-850 p-3 bg-slate-50 dark:bg-slate-950 rounded text-left">
                    <h5 className="text-xs font-bold text-slate-450 mb-2 uppercase tracking-wide flex items-center space-x-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span>Validation log issues</span>
                    </h5>
                    <ul className="text-[10px] space-y-1 text-red-500 list-disc pl-4 font-mono leading-relaxed">
                      {uploadSummary.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="w-full py-2.5 bg-slate-105 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold rounded text-xs transition"
                >
                  Close Summary
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && pendingDelete && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center mx-auto">
              <Trash2 className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Delete Question?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                &ldquo;{pendingDelete.label}&hellip;&rdquo;
              </p>
              <p className="text-xs text-slate-400 mt-2">This will soft-delete all versions of this question.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md active:scale-[0.98] transition text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminQuestions;
