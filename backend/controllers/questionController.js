const Question = require('../models/Question');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { importQuestionsFromExcel } = require('../services/importExportService');
const mongoose = require('mongoose');

const getQuestions = async (req, res, next) => {
  try {
    const { category, difficulty, search } = req.query;
    
    // Aggregate to find the latest active version of each question
    const pipeline = [
      { $match: { isDeleted: false } },
      { $sort: { questionId: 1, version: -1 } },
      {
        $group: {
          _id: '$questionId',
          latestDoc: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$latestDoc' } }
    ];

    let questions = await Question.aggregate(pipeline);

    // Apply client filters in memory
    if (category) {
      questions = questions.filter(q => q.category.toLowerCase() === category.toLowerCase());
    }
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      questions = questions.filter(q => regex.test(q.question) || regex.test(q.category));
    }

    res.json(questions);
  } catch (error) {
    next(error);
  }
};

const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params; // logically questionId
    
    // Find the latest active version
    const questions = await Question.find({ questionId: id, isDeleted: false })
      .sort({ version: -1 })
      .limit(1);

    if (questions.length === 0) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    res.json(questions[0]);
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { question, options, correctAnswer, category, difficulty } = req.body;
    
    const newQuestionId = new mongoose.Types.ObjectId();
    const newQuestion = new Question({
      questionId: newQuestionId,
      version: 1,
      question,
      options,
      correctAnswer,
      category,
      difficulty,
      updatedBy: req.admin.username
    });

    await newQuestion.save();

    // Audit Log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'QUESTION_CREATE',
      ipAddress,
      metadata: { questionId: newQuestionId, question }
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params; // logically questionId
    const { question, options, correctAnswer, category, difficulty } = req.body;

    // Find the latest active version of the question
    const current = await Question.findOne({ questionId: id, isDeleted: false }).sort({ version: -1 });
    if (!current) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    // Question versioning: Increment version and create a new document
    const nextVersion = new Question({
      questionId: id, // maintain same logical question ID
      version: current.version + 1,
      question: question || current.question,
      options: options || current.options,
      correctAnswer: correctAnswer || current.correctAnswer,
      category: category || current.category,
      difficulty: difficulty || current.difficulty,
      updatedBy: req.admin.username
    });

    await nextVersion.save();

    // Audit Log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'QUESTION_UPDATE',
      ipAddress,
      metadata: { questionId: id, version: nextVersion.version }
    });

    res.json(nextVersion);
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params; // logically questionId

    // Soft-delete all versions of this question
    const result = await Question.updateMany(
      { questionId: id },
      { $set: { isDeleted: true } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    // Audit Log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'QUESTION_DELETE',
      ipAddress,
      metadata: { questionId: id }
    });

    res.json({ success: true, message: 'Question successfully soft-deleted.' });
  } catch (error) {
    next(error);
  }
};

const bulkImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Excel file (.xlsx) is required.' });
    }

    const summary = await importQuestionsFromExcel(req.file.buffer, req.admin.username);

    // Save logs and emit notification
    const notification = await Notification.create({
      title: 'Bulk Question Import',
      message: `Questions imported: ${summary.successCount} succeeded, ${summary.failedCount} failed.`,
      type: summary.failedCount > 0 ? 'import_fail' : 'import_success',
      createdAt: new Date()
    });

    if (req.io) {
      req.io.to('admin_notifications').emit('new_notification', notification);
    }

    // Audit Log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'QUESTION_BULK_IMPORT',
      ipAddress,
      metadata: { successCount: summary.successCount, failedCount: summary.failedCount }
    });

    res.json(summary);
  } catch (error) {
    next(error);
  }
};

const getVersionHistory = async (req, res, next) => {
  try {
    const { id } = req.params; // logically questionId
    const history = await Question.find({ questionId: id }).sort({ version: -1 });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImport,
  getVersionHistory
};
