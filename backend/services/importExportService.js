const XLSX = require('xlsx');
const Question = require('../models/Question');
const Candidate = require('../models/Candidate');
const QuizAttempt = require('../models/QuizAttempt');
const Counter = require('../models/Counter');
const mongoose = require('mongoose');

// Bulk question import from Excel
const importQuestionsFromExcel = async (buffer, adminUsername) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const summary = {
    totalRows: rows.length,
    successCount: 0,
    failedCount: 0,
    errors: []
  };

  const questionsToInsert = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Row number in Excel sheet (1-based + header)
    
    // Extract fields
    const questionText = row['Question'];
    const optionA = row['Option A'];
    const optionB = row['Option B'];
    const optionC = row['Option C'];
    const optionD = row['Option D'];
    const correctAnswerVal = row['Correct Answer'];
    const category = row['Category'];
    const difficultyVal = row['Difficulty'];

    // Validations
    if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswerVal || !category || !difficultyVal) {
      summary.failedCount++;
      summary.errors.push(`Row ${rowNum}: Missing required fields.`);
      continue;
    }

    const options = [optionA.toString().trim(), optionB.toString().trim(), optionC.toString().trim(), optionD.toString().trim()];
    const correctAnswer = correctAnswerVal.toString().trim();
    const difficulty = difficultyVal.toString().toLowerCase().trim();

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      summary.failedCount++;
      summary.errors.push(`Row ${rowNum}: Difficulty must be 'easy', 'medium', or 'hard'. Got '${difficultyVal}'`);
      continue;
    }

    // Correct Answer must match exactly one of the options
    if (!options.includes(correctAnswer)) {
      summary.failedCount++;
      summary.errors.push(`Row ${rowNum}: Correct Answer must match exactly one of Option A, B, C, or D.`);
      continue;
    }

    // Build Question document details (assigning new questionId)
    const newQuestionId = new mongoose.Types.ObjectId();
    questionsToInsert.push({
      questionId: newQuestionId,
      version: 1,
      question: questionText.toString().trim(),
      options,
      correctAnswer,
      category: category.toString().trim(),
      difficulty,
      updatedBy: adminUsername || 'admin'
    });
  }

  // Batch insert valid questions
  if (questionsToInsert.length > 0) {
    await Question.insertMany(questionsToInsert);
    summary.successCount = questionsToInsert.length;
  }

  return summary;
};

// Bulk candidate import from Excel
const importCandidatesFromExcel = async (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const summary = {
    totalRows: rows.length,
    successCount: 0,
    failedCount: 0,
    errors: []
  };

  const candidatesInserted = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const name = row['Name'];
    const emailVal = row['Email'];

    if (!name || !emailVal) {
      summary.failedCount++;
      summary.errors.push(`Row ${rowNum}: Name and Email are required.`);
      continue;
    }

    const email = emailVal.toString().toLowerCase().trim();
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      summary.failedCount++;
      summary.errors.push(`Row ${rowNum}: Invalid email format '${emailVal}'.`);
      continue;
    }

    // Check if email already registered
    const existing = await Candidate.findOne({ email, isDeleted: false });
    if (existing) {
      summary.failedCount++;
      summary.errors.push(`Row ${rowNum}: Candidate with email '${email}' is already registered.`);
      continue;
    }

    // Generate Candidate ID sequentially
    const counter = await Counter.findByIdAndUpdate(
      'candidateId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const year = new Date().getFullYear();
    const serial = String(counter.seq).padStart(4, '0');
    const candidateId = `CYBER-${year}-${serial}`;

    const newCandidate = new Candidate({
      candidateId,
      name: name.toString().trim(),
      email
    });

    await newCandidate.save();
    candidatesInserted.push(newCandidate);
  }

  summary.successCount = candidatesInserted.length;
  return summary;
};

// Export Attempts to XLSX buffer
const exportAttemptsToExcel = async (attemptsFilter = {}) => {
  const attempts = await QuizAttempt.find({ ...attemptsFilter, isDeleted: false })
    .populate('quiz', 'title code')
    .sort({ createdAt: -1 });

  const data = attempts.map(a => ({
    'Candidate ID': a.candidateId,
    'Name': a.candidateName,
    'Email': a.candidateEmail,
    'Quiz Title': a.quiz ? a.quiz.title : 'N/A',
    'Quiz Code': a.quiz ? a.quiz.code : 'N/A',
    'Score': a.score,
    'Percentage (%)': a.percentage,
    'Pass/Fail': a.passOrFail,
    'Status': a.status,
    'Violations Count': a.violationCount,
    'Time Taken (s)': a.timeTaken,
    'IP Address': a.ipAddress || 'N/A',
    'User Agent': a.userAgent || 'N/A',
    'Device Type': a.deviceType || 'N/A',
    'OS': a.os || 'N/A',
    'Submission Date': a.submittedAt ? new Date(a.submittedAt).toLocaleString() : 'N/A'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attempts Report');

  // Set column widths
  const maxW = 20;
  worksheet['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: maxW }));

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
};

// Export Attempts to CSV string
const exportAttemptsToCSV = async (attemptsFilter = {}) => {
  const attempts = await QuizAttempt.find({ ...attemptsFilter, isDeleted: false })
    .populate('quiz', 'title code')
    .sort({ createdAt: -1 });

  const headers = [
    'Candidate ID', 'Name', 'Email', 'Quiz Title', 'Quiz Code', 
    'Score', 'Percentage (%)', 'Pass/Fail', 'Status', 'Violations Count', 
    'Time Taken (s)', 'IP Address', 'Submission Date'
  ];

  let csvContent = headers.join(',') + '\n';

  attempts.forEach(a => {
    const row = [
      `"${a.candidateId}"`,
      `"${a.candidateName.replace(/"/g, '""')}"`,
      `"${a.candidateEmail}"`,
      `"${(a.quiz ? a.quiz.title : 'N/A').replace(/"/g, '""')}"`,
      `"${a.quiz ? a.quiz.code : 'N/A'}"`,
      a.score,
      a.percentage,
      `"${a.passOrFail}"`,
      `"${a.status}"`,
      a.violationCount,
      a.timeTaken,
      `"${a.ipAddress || 'N/A'}"`,
      `"${a.submittedAt ? new Date(a.submittedAt).toISOString() : 'N/A'}"`
    ];
    csvContent += row.join(',') + '\n';
  });

  return csvContent;
};

// Database JSON Backups
const generateDatabaseBackups = async () => {
  const questions = await Question.find({ isDeleted: false });
  const attempts = await QuizAttempt.find({ isDeleted: false });
  
  // Exclude system accounts/keys or configuration if sensitive
  const candidates = await Candidate.find({ isDeleted: false });

  return {
    backupTimestamp: new Date(),
    questions,
    attempts,
    candidates
  };
};

module.exports = {
  importQuestionsFromExcel,
  importCandidatesFromExcel,
  exportAttemptsToExcel,
  exportAttemptsToCSV,
  generateDatabaseBackups
};
