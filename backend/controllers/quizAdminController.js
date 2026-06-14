const Quiz = require('../models/Quiz');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

const getQuizzes = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { isDeleted: false };
    
    if (status) {
      filter.status = status;
    }

    const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    next(error);
  }
};

const getQuizById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findOne({ _id: id, isDeleted: false });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }
    res.json(quiz);
  } catch (error) {
    next(error);
  }
};

const createQuiz = async (req, res, next) => {
  try {
    const {
      title,
      description,
      code,
      status,
      startDate,
      endDate,
      duration,
      passingPercentage,
      questionCount,
      randomizeQuestions,
      randomizeOptions,
      fullscreenRequirement,
      violationLimit,
      autoSubmitEnabled,
      pinnedQuestions
    } = req.body;

    // Verify code uniqueness
    const existing = await Quiz.findOne({ code: code.toUpperCase().trim(), isDeleted: false });
    if (existing) {
      return res.status(400).json({ message: `A quiz with entry code '${code}' already exists.` });
    }

    const newQuiz = new Quiz({
      title,
      description,
      code: code.toUpperCase().trim(),
      status: status || 'Draft',
      startDate,
      endDate,
      duration,
      passingPercentage,
      questionCount,
      randomizeQuestions,
      randomizeOptions,
      fullscreenRequirement,
      violationLimit,
      autoSubmitEnabled,
      pinnedQuestions
    });

    await newQuiz.save();

    // Notification & Audit
    await Notification.create({
      title: 'New Quiz Created',
      message: `Quiz "${title}" (${code}) has been created by ${req.admin.username}`,
      type: 'settings_changed',
      createdAt: new Date()
    });

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'QUIZ_CREATE',
      ipAddress,
      metadata: { quizId: newQuiz._id, code }
    });

    res.status(201).json(newQuiz);
  } catch (error) {
    next(error);
  }
};

const updateQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      code,
      status,
      startDate,
      endDate,
      duration,
      passingPercentage,
      questionCount,
      randomizeQuestions,
      randomizeOptions,
      fullscreenRequirement,
      violationLimit,
      autoSubmitEnabled,
      pinnedQuestions
    } = req.body;

    const quiz = await Quiz.findOne({ _id: id, isDeleted: false });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    // If changing entry code, verify uniqueness
    if (code && code.toUpperCase().trim() !== quiz.code) {
      const existing = await Quiz.findOne({ code: code.toUpperCase().trim(), isDeleted: false });
      if (existing) {
        return res.status(400).json({ message: `A quiz with entry code '${code}' already exists.` });
      }
      quiz.code = code.toUpperCase().trim();
    }

    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (status !== undefined) quiz.status = status;
    if (startDate !== undefined) quiz.startDate = startDate;
    if (endDate !== undefined) quiz.endDate = endDate;
    if (duration !== undefined) quiz.duration = Number(duration);
    if (passingPercentage !== undefined) quiz.passingPercentage = Number(passingPercentage);
    if (questionCount !== undefined) quiz.questionCount = Number(questionCount);
    if (randomizeQuestions !== undefined) quiz.randomizeQuestions = randomizeQuestions;
    if (randomizeOptions !== undefined) quiz.randomizeOptions = randomizeOptions;
    if (fullscreenRequirement !== undefined) quiz.fullscreenRequirement = fullscreenRequirement;
    if (violationLimit !== undefined) quiz.violationLimit = Number(violationLimit);
    if (autoSubmitEnabled !== undefined) quiz.autoSubmitEnabled = autoSubmitEnabled;
    if (pinnedQuestions !== undefined) quiz.pinnedQuestions = pinnedQuestions;

    await quiz.save();

    // Audit Log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'QUIZ_UPDATE',
      ipAddress,
      metadata: { quizId: id, code: quiz.code }
    });

    res.json(quiz);
  } catch (error) {
    next(error);
  }
};

const deleteQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findOne({ _id: id, isDeleted: false });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    quiz.isDeleted = true;
    await quiz.save();

    // Audit Log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'QUIZ_DELETE',
      ipAddress,
      metadata: { quizId: id, code: quiz.code }
    });

    res.json({ success: true, message: 'Quiz successfully soft-deleted.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /quizzes/:id/toggle-status — flip Active <-> Draft
const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findOne({ _id: id, isDeleted: false });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }
    if (quiz.status === 'Archived') {
      return res.status(400).json({ message: 'Archived quizzes cannot be toggled.' });
    }
    quiz.status = quiz.status === 'Active' ? 'Draft' : 'Active';
    await quiz.save();

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'QUIZ_TOGGLE_STATUS',
      ipAddress,
      metadata: { quizId: id, newStatus: quiz.status }
    });

    res.json(quiz);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  toggleStatus
};
