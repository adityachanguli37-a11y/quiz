import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { 
  ClipboardList, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  Percent, 
  ShieldAlert, 
  Power,
  BookMarked,
  Search,
  X,
  CheckSquare,
  Square,
  ListChecks
} from 'lucide-react';

const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [togglingId, setTogglingId] = useState(null); // quiz being toggled

  // Question picker state
  const [pickerQuiz, setPickerQuiz] = useState(null); // quiz being configured
  const [allQuestions, setAllQuestions] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState('');
  const [selectedQIds, setSelectedQIds] = useState([]); // questionId strings
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    status: 'Draft',
    startDate: '',
    endDate: '',
    duration: 10,
    passingPercentage: 70,
    questionCount: 10,
    randomizeQuestions: true,
    randomizeOptions: true,
    fullscreenRequirement: true,
    violationLimit: 3,
    autoSubmitEnabled: true
  });

  const fetchQuizzes = async () => {
    try {
      const response = await api.get('/quizzes');
      setQuizzes(response.data);
    } catch (err) {
      setError('Failed to fetch quizzes list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // ─── Toggle Status ────────────────────────────────────────────────────────
  const handleToggleStatus = async (quiz) => {
    if (quiz.status === 'Archived') return;
    setTogglingId(quiz._id);
    try {
      const res = await api.patch(`/quizzes/${quiz._id}/toggle-status`);
      setQuizzes(prev => prev.map(q => q._id === quiz._id ? res.data : q));
    } catch (err) {
      alert('Failed to toggle quiz status.');
    } finally {
      setTogglingId(null);
    }
  };

  // ─── Question Picker ──────────────────────────────────────────────────────
  const handleOpenPicker = async (quiz) => {
    setPickerQuiz(quiz);
    setPickerSearch('');
    setPickerCategory('');
    // Pre-select currently pinned questions (convert ObjectIds to strings)
    setSelectedQIds((quiz.pinnedQuestions || []).map(id => id.toString()));
    setPickerLoading(true);
    try {
      const res = await api.get('/questions');
      setAllQuestions(res.data);
    } catch {
      alert('Failed to load questions.');
    } finally {
      setPickerLoading(false);
    }
  };

  const handleOpenPickerFromModal = async () => {
    const tempQuiz = editingQuiz 
      ? { ...editingQuiz, isFromModal: true } 
      : { code: formData.code || 'NEW', isFromModal: true };
    setPickerQuiz(tempQuiz);
    setPickerSearch('');
    setPickerCategory('');
    setSelectedQIds(formData.pinnedQuestions || []);
    setPickerLoading(true);
    try {
      const res = await api.get('/questions');
      setAllQuestions(res.data);
    } catch {
      alert('Failed to load questions.');
    } finally {
      setPickerLoading(false);
    }
  };

  const handleClosePicker = () => {
    setPickerQuiz(null);
    setAllQuestions([]);
    setSelectedQIds([]);
  };

  const handleSavePinned = async () => {
    if (!pickerQuiz) return;
    if (pickerQuiz.isFromModal) {
      setFormData(prev => ({
        ...prev,
        pinnedQuestions: selectedQIds,
        questionCount: selectedQIds.length > 0 ? selectedQIds.length : prev.questionCount
      }));
      handleClosePicker();
      return;
    }
    try {
      const res = await api.put(`/quizzes/${pickerQuiz._id}`, {
        pinnedQuestions: selectedQIds
      });
      setQuizzes(prev => prev.map(q => q._id === pickerQuiz._id ? res.data : q));
      handleClosePicker();
    } catch (err) {
      alert('Failed to save question selection.');
    }
  };

  const toggleQSelection = (qId) => {
    const id = qId.toString();
    setSelectedQIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Filtered questions in the picker
  const pickerCategories = useMemo(() => [...new Set(allQuestions.map(q => q.category))], [allQuestions]);
  const filteredPickerQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      const matchCat = !pickerCategory || q.category === pickerCategory;
      const matchSearch = !pickerSearch || q.question.toLowerCase().includes(pickerSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allQuestions, pickerCategory, pickerSearch]);

  const allFilteredSelected = filteredPickerQuestions.length > 0 &&
    filteredPickerQuestions.every(q => selectedQIds.includes(q.questionId.toString()));

  const toggleSelectAllFiltered = () => {
    const ids = filteredPickerQuestions.map(q => q.questionId.toString());
    if (allFilteredSelected) {
      setSelectedQIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedQIds(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const handleOpenCreate = () => {
    setEditingQuiz(null);
    setFormData({
      title: '',
      description: '',
      code: '',
      status: 'Draft',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: 10,
      passingPercentage: 70,
      questionCount: 10,
      randomizeQuestions: true,
      randomizeOptions: true,
      fullscreenRequirement: true,
      violationLimit: 3,
      autoSubmitEnabled: true,
      pinnedQuestions: []
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      title: quiz.title,
      description: quiz.description || '',
      code: quiz.code,
      status: quiz.status,
      startDate: new Date(quiz.startDate).toISOString().split('T')[0],
      endDate: new Date(quiz.endDate).toISOString().split('T')[0],
      duration: quiz.duration,
      passingPercentage: quiz.passingPercentage,
      questionCount: quiz.questionCount,
      randomizeQuestions: quiz.randomizeQuestions,
      randomizeOptions: quiz.randomizeOptions,
      fullscreenRequirement: quiz.fullscreenRequirement,
      violationLimit: quiz.violationLimit,
      autoSubmitEnabled: quiz.autoSubmitEnabled,
      pinnedQuestions: (quiz.pinnedQuestions || []).map(id => id.toString())
    });
    setError('');
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.code.trim()) {
      setError('Title and Access Code are required.');
      return;
    }

    try {
      if (editingQuiz) {
        // Edit Quiz
        await api.put(`/quizzes/${editingQuiz._id}`, formData);
      } else {
        // Create Quiz
        await api.post('/quizzes', formData);
      }
      setShowModal(false);
      fetchQuizzes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save quiz details.');
    }
  };

  const handleDelete = (id, code) => {
    setPendingDelete({ id, label: code });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setShowDeleteModal(false);
    try {
      await api.delete(`/quizzes/${pendingDelete.id}`);
      fetchQuizzes();
    } catch (err) {
      alert('Failed to delete quiz.');
    } finally {
      setPendingDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPendingDelete(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded skeleton-loading"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl skeleton-loading"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <ClipboardList className="h-7 w-7 text-sky-500" />
            <span>Quiz Management</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Configure multiple cybersecurity assessments and timelines.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm shadow-md transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Assessment</span>
        </button>
      </div>

      {/* Quizzes List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.length > 0 ? (
          quizzes.map((quiz) => {
            const isDraft = quiz.status === 'Draft';
            const isArchived = quiz.status === 'Archived';
            return (
              <div 
                key={quiz._id} 
                className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-md flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  {/* Header: Code & Status */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-mono font-bold text-sky-500 bg-sky-500/10 px-2.5 py-1 rounded text-sm tracking-wider">
                      {quiz.code}
                    </span>
                    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full
                      ${isDraft ? 'bg-amber-500/10 text-amber-500' :
                        isArchived ? 'bg-slate-500/10 text-slate-400' :
                        'bg-emerald-500/10 text-emerald-500'}`}>
                      {quiz.status}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-slate-905 dark:text-white mb-2">{quiz.title}</h3>
                  <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed line-clamp-2 mb-6">
                    {quiz.description || 'No description provided.'}
                  </p>

                  {/* Pin badge */}
                  {quiz.pinnedQuestions && quiz.pinnedQuestions.length > 0 ? (
                    <div className="inline-flex items-center space-x-1 text-[10px] font-semibold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full mb-4">
                      <BookMarked className="h-3 w-3" />
                      <span>{quiz.pinnedQuestions.length} pinned questions</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-1 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full mb-4">
                      <span>Random pool</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 border-t border-slate-100 dark:border-slate-850 pt-4 text-xs text-slate-500 dark:text-slate-400 mb-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{quiz.duration} Minutes limit</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Percent className="h-4 w-4 text-slate-400" />
                      <span>{quiz.passingPercentage}% Pass Mark</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ClipboardList className="h-4 w-4 text-slate-400" />
                      <span>{quiz.questionCount} Questions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="h-4 w-4 text-slate-400" />
                      <span>Limit: {quiz.violationLimit} Cheats</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4">
                  <div className="flex items-center text-[10px] text-slate-400 space-x-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(quiz.startDate).toLocaleDateString()} - {new Date(quiz.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    {/* Manage Questions */}
                    <button
                      onClick={() => handleOpenPicker(quiz)}
                      className="p-2 rounded-lg bg-sky-500/5 hover:bg-sky-500/15 text-sky-500 border border-sky-500/10 transition-colors"
                      title="Select questions for this quiz"
                    >
                      <ListChecks className="h-4 w-4" />
                    </button>
                    {/* Toggle Active/Draft */}
                    <button
                      onClick={() => handleToggleStatus(quiz)}
                      disabled={quiz.status === 'Archived' || togglingId === quiz._id}
                      className={`p-2 rounded-lg border transition-colors ${
                        quiz.status === 'Archived'
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
                          : quiz.status === 'Active'
                          ? 'bg-red-500/5 hover:bg-red-500/15 text-red-500 border-red-500/10'
                          : 'bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-500 border-emerald-500/10'
                      }`}
                      title={quiz.status === 'Active' ? 'Deactivate quiz' : quiz.status === 'Draft' ? 'Activate quiz' : 'Archived'}
                    >
                      <Power className={`h-4 w-4 ${togglingId === quiz._id ? 'animate-pulse' : ''}`} />
                    </button>
                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(quiz)}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400 hover:text-sky-500 transition-colors"
                      title="Edit settings"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(quiz._id, quiz.code)}
                      className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 transition-colors"
                      title="Delete assessment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-12 text-center rounded-xl text-slate-400 font-mono text-sm shadow-md">
            No cybersecurity assessments created yet.
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark w-full max-w-xl rounded-xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
              {editingQuiz ? 'Update Assessment Details' : 'Configure New Assessment'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-505/10 border border-red-500/25 text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: Title & Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quiz Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quiz Code</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm"
                />
              </div>

              {/* Row 3: Status, Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Row 4: Config Settings Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-850 pt-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Duration (mins)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white text-sm"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Pass Mark (%)</label>
                  <input
                    type="number"
                    name="passingPercentage"
                    value={formData.passingPercentage}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white text-sm"
                    min="1"
                    max="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Questions Count</label>
                  <input
                    type="number"
                    name="questionCount"
                    value={formData.questionCount}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white text-sm"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Violation Limit</label>
                  <input
                    type="number"
                    name="violationLimit"
                    value={formData.violationLimit}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white text-sm"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Question Selection Block */}
              <div className="border-t border-slate-100 dark:border-slate-850 pt-4">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Question Selection Method</label>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-lg border border-slate-150 dark:border-slate-850">
                  <div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {formData.pinnedQuestions && formData.pinnedQuestions.length > 0 
                        ? `Curated Pool: ${formData.pinnedQuestions.length} questions selected` 
                        : 'Random Pool: Balanced random sampling from full bank'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {formData.pinnedQuestions && formData.pinnedQuestions.length > 0 
                        ? (formData.questionCount > formData.pinnedQuestions.length 
                          ? `Will draw all ${formData.pinnedQuestions.length} pinned questions (capped).` 
                          : `Will draw ${formData.questionCount} questions from the pool of ${formData.pinnedQuestions.length}.`)
                        : `Will draw ${formData.questionCount} random questions from the question bank.`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenPickerFromModal}
                    className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <ListChecks className="h-4 w-4" />
                    <span>Select Specific Questions</span>
                  </button>
                </div>
              </div>

              {/* Row 5: Checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-850 pt-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="randomizeQuestions"
                      id="randomizeQuestions"
                      checked={formData.randomizeQuestions}
                      onChange={handleChange}
                      className="rounded border-slate-350 focus:ring-sky-500"
                    />
                    <label htmlFor="randomizeQuestions" className="text-xs font-semibold text-slate-500">Randomize Question Order</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="randomizeOptions"
                      id="randomizeOptions"
                      checked={formData.randomizeOptions}
                      onChange={handleChange}
                      className="rounded border-slate-350 focus:ring-sky-500"
                    />
                    <label htmlFor="randomizeOptions" className="text-xs font-semibold text-slate-500">Randomize Answer Options</label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="fullscreenRequirement"
                      id="fullscreenRequirement"
                      checked={formData.fullscreenRequirement}
                      onChange={handleChange}
                      className="rounded border-slate-350 focus:ring-sky-500"
                    />
                    <label htmlFor="fullscreenRequirement" className="text-xs font-semibold text-slate-500">Require Fullscreen Mode</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="autoSubmitEnabled"
                      id="autoSubmitEnabled"
                      checked={formData.autoSubmitEnabled}
                      onChange={handleChange}
                      className="rounded border-slate-350 focus:ring-sky-500"
                    />
                    <label htmlFor="autoSubmitEnabled" className="text-xs font-semibold text-slate-500">Auto-Submit Enabled</label>
                  </div>
                </div>
              </div>

              {/* Save / Cancel buttons */}
              <div className="flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-850 text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm shadow-md transition"
                >
                  Save Assessment
                </button>
              </div>

            </form>

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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Delete Assessment?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quiz code: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{pendingDelete.label}</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">This action will archive the quiz and cannot be undone.</p>
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

      {/* Question Picker Drawer */}
      {pickerQuiz && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-stretch justify-end z-50">
          <div className="bg-white dark:bg-cyber-panel-dark border-l border-slate-200 dark:border-cyber-border-dark w-full max-w-2xl flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <ListChecks className="h-5 w-5 text-sky-500" />
                  <span>Question Pool — <span className="font-mono text-sky-500">{pickerQuiz.code}</span></span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select which questions candidates will see. Leave empty to use balanced random sampling.
                </p>
              </div>
              <button onClick={handleClosePicker} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </div>
              <select
                value={pickerCategory}
                onChange={e => setPickerCategory(e.target.value)}
                className="text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="">All Categories</option>
                {pickerCategories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Selection bar */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <button
                onClick={toggleSelectAllFiltered}
                className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-500 transition"
              >
                {allFilteredSelected ? <CheckSquare className="h-4 w-4 text-sky-500" /> : <Square className="h-4 w-4" />}
                <span>Select all visible ({filteredPickerQuestions.length})</span>
              </button>
              <span className="text-xs font-bold text-sky-500">
                {selectedQIds.length} selected
                {selectedQIds.length > 0 && (
                  <button
                    onClick={() => setSelectedQIds([])}
                    className="ml-2 text-slate-400 hover:text-red-500 transition font-normal"
                  >
                    Clear all
                  </button>
                )}
              </span>
            </div>

            {/* Question list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
              {pickerLoading ? (
                <div className="py-20 text-center text-slate-400 font-mono text-sm animate-pulse">Loading questions...</div>
              ) : filteredPickerQuestions.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-mono text-sm">No questions match the filter.</div>
              ) : (
                filteredPickerQuestions.map(q => {
                  const qIdStr = q.questionId.toString();
                  const isSelected = selectedQIds.includes(qIdStr);
                  return (
                    <label
                      key={q._id}
                      className={`flex items-start gap-3 px-6 py-4 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-sky-500/5 dark:bg-sky-500/5'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-855/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleQSelection(q.questionId)}
                        className="mt-0.5 rounded border-slate-300 focus:ring-sky-500 accent-sky-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-relaxed ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {q.question}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-sky-500 font-medium">{q.category}</span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-500' :
                            q.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>{q.difficulty}</span>
                          <span className="text-[10px] text-slate-400 font-mono">v{q.version}</span>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
              <p className="text-xs text-slate-400">
                {selectedQIds.length === 0
                  ? 'No questions pinned — will use random balanced sampling'
                  : `${selectedQIds.length} question${selectedQIds.length !== 1 ? 's' : ''} will be used for this quiz`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClosePicker}
                  className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePinned}
                  className="px-5 py-2 text-sm bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg shadow-md transition"
                >
                  Save Selection
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminQuizzes;

