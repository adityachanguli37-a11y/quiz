const QuizAttempt = require('../models/QuizAttempt');
const Question = require('../models/Question');
const Candidate = require('../models/Candidate');
const Quiz = require('../models/Quiz');
const mongoose = require('mongoose');

const getDashboardStats = async () => {
  // 1. General Metrics counts
  const totalCandidates = await Candidate.countDocuments({ isDeleted: false });
  const activeAttempts = await QuizAttempt.countDocuments({ status: 'in_progress', isDeleted: false });
  const submittedAttempts = await QuizAttempt.countDocuments({ status: { $in: ['submitted', 'auto_submitted'] }, isDeleted: false });
  const disqualifiedAttempts = await QuizAttempt.countDocuments({ status: 'disqualified', isDeleted: false });
  const totalAttempts = await QuizAttempt.countDocuments({ isDeleted: false });

  // 2. Average Score & Pass Rate
  const completedAttempts = await QuizAttempt.find({ 
    status: { $in: ['submitted', 'auto_submitted'] }, 
    isDeleted: false 
  });
  
  let averageScore = 0;
  let passCount = 0;
  let failCount = 0;
  let totalCompletionTime = 0;
  let totalViolations = 0;

  if (completedAttempts.length > 0) {
    let sumScore = 0;
    completedAttempts.forEach(a => {
      sumScore += a.score;
      if (a.passOrFail === 'Pass') passCount++;
      else failCount++;
      if (a.timeTaken) totalCompletionTime += a.timeTaken;
    });
    averageScore = Math.round((sumScore / completedAttempts.length) * 10) / 10;
  }

  // Calculate violations average across all attempts
  const allAttempts = await QuizAttempt.find({ isDeleted: false });
  if (allAttempts.length > 0) {
    let violationsSum = 0;
    allAttempts.forEach(a => {
      violationsSum += (a.violationCount || 0);
    });
    totalViolations = Math.round((violationsSum / allAttempts.length) * 10) / 10;
  }

  const passRate = completedAttempts.length > 0 ? Math.round((passCount / completedAttempts.length) * 100) : 0;
  const failRate = completedAttempts.length > 0 ? Math.round((failCount / completedAttempts.length) * 100) : 0;
  const avgCompletionTime = completedAttempts.length > 0 ? Math.round(totalCompletionTime / completedAttempts.length) : 0;

  // 3. Category Performance Metrics
  // Group all questions answered in completed attempts
  const categoryStatsMap = {};
  completedAttempts.forEach(attempt => {
    attempt.questions.forEach(qSnapshot => {
      const cat = qSnapshot.category || 'General';
      if (!categoryStatsMap[cat]) {
        categoryStatsMap[cat] = { attempts: 0, correct: 0, total: 0 };
      }
      
      const isCorrect = attempt.answers.get(qSnapshot.questionId.toString()) === qSnapshot.correctAnswer;
      categoryStatsMap[cat].attempts++;
      categoryStatsMap[cat].total++;
      if (isCorrect) {
        categoryStatsMap[cat].correct++;
      }
    });
  });

  const categoryPerformance = Object.keys(categoryStatsMap).map(category => {
    const stats = categoryStatsMap[category];
    const successRate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    const avgScore = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 10) / 10 : 0;
    return {
      category,
      attempts: stats.attempts,
      avgScore,
      successRate
    };
  });

  // 4. Hardest & Easiest Questions (Top 10)
  // Gather metrics on how many times each question was answered, and how many times correct
  const questionPerformanceMap = {};
  completedAttempts.forEach(attempt => {
    attempt.questions.forEach(qSnapshot => {
      const qId = qSnapshot.questionId.toString();
      if (!questionPerformanceMap[qId]) {
        questionPerformanceMap[qId] = {
          questionText: qSnapshot.question,
          category: qSnapshot.category,
          correct: 0,
          total: 0
        };
      }
      const isCorrect = attempt.answers.get(qId) === qSnapshot.correctAnswer;
      questionPerformanceMap[qId].total++;
      if (isCorrect) {
        questionPerformanceMap[qId].correct++;
      }
    });
  });

  const questionList = Object.keys(questionPerformanceMap).map(id => {
    const stats = questionPerformanceMap[id];
    const wrongCount = stats.total - stats.correct;
    const wrongRate = stats.total > 0 ? Math.round((wrongCount / stats.total) * 100) : 0;
    const rightRate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return {
      questionId: id,
      questionText: stats.questionText,
      category: stats.category,
      wrongAnswerPercentage: wrongRate,
      rightAnswerPercentage: rightRate,
      totalResponses: stats.total
    };
  });

  const hardestQuestions = [...questionList]
    .sort((a, b) => b.wrongAnswerPercentage - a.wrongAnswerPercentage)
    .slice(0, 10);

  const easiestQuestions = [...questionList]
    .sort((a, b) => b.rightAnswerPercentage - a.rightAnswerPercentage)
    .slice(0, 10);

  // 5. Violation Statistics counts
  const violationCounts = {
    tab_switch: 0,
    fullscreen_exit: 0,
    devtools_detected: 0,
    copy_attempt: 0,
    paste_attempt: 0,
    right_click: 0,
    shortcut_usage: 0
  };

  allAttempts.forEach(attempt => {
    (attempt.violationDetails || []).forEach(v => {
      if (violationCounts[v.violationType] !== undefined) {
        violationCounts[v.violationType]++;
      }
    });
  });

  const violationStats = Object.keys(violationCounts).map(type => ({
    name: type.replace('_', ' ').toUpperCase(),
    value: violationCounts[type]
  }));

  // 6. Trend Analysis (Daily attempts for the last 15 days)
  const dailyParticipation = await getDailyTrend(15);

  return {
    totalCandidates,
    activeParticipants: activeAttempts,
    submittedAttempts,
    disqualifiedAttempts,
    totalAttempts,
    averageScore,
    passRate,
    failRate,
    avgCompletionTime,
    avgViolationsPerUser: totalViolations,
    categoryPerformance,
    hardestQuestions,
    easiestQuestions,
    violationStats,
    dailyParticipation
  };
};

const getDailyTrend = async (days = 15) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  cutoffDate.setHours(0, 0, 0, 0);

  const attempts = await QuizAttempt.aggregate([
    {
      $match: {
        createdAt: { $gte: cutoffDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        attempts: { $sum: 1 },
        passes: {
          $sum: { $cond: [{ $eq: ['$passOrFail', 'Pass'] }, 1, 0] }
        },
        fails: {
          $sum: { $cond: [{ $eq: ['$passOrFail', 'Fail'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Fill in missing dates to ensure smooth chart rendering
  const trendData = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const dbRecord = attempts.find(a => a._id === dateStr);
    trendData.push({
      date: dateStr,
      attempts: dbRecord ? dbRecord.attempts : 0,
      passes: dbRecord ? dbRecord.passes : 0,
      fails: dbRecord ? dbRecord.fails : 0
    });
  }

  return trendData;
};

// Advanced filter, sort, search and page attempts
const searchAttempts = async (filters, page = 1, limit = 10) => {
  const query = { isDeleted: false };

  // Candidate Filters
  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { candidateName: searchRegex },
      { candidateEmail: searchRegex },
      { candidateId: searchRegex }
    ];
  }

  // Quiz code / name filter
  if (filters.quizId) {
    query.quiz = filters.quizId;
  }

  // Attempt Status
  if (filters.status) {
    query.status = filters.status;
  }

  // Pass / Fail status
  if (filters.passOrFail) {
    query.passOrFail = filters.passOrFail;
  }

  // Score Range filtering
  if (filters.minScore !== undefined || filters.maxScore !== undefined) {
    query.score = {};
    if (filters.minScore !== undefined) query.score.$gte = Number(filters.minScore);
    if (filters.maxScore !== undefined) query.score.$lte = Number(filters.maxScore);
  }

  // Date range filters
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const skip = (page - 1) * limit;
  const sortField = filters.sortBy || 'createdAt';
  const sortDirection = filters.sortOrder === 'asc' ? 1 : -1;

  const total = await QuizAttempt.countDocuments(query);
  const attempts = await QuizAttempt.find(query)
    .populate('quiz', 'title code')
    .sort({ [sortField]: sortDirection })
    .skip(skip)
    .limit(Number(limit));

  return {
    attempts,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  getDashboardStats,
  searchAttempts
};
