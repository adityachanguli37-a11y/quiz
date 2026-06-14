const Quiz = require('../models/Quiz');
const Candidate = require('../models/Candidate');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');
const Counter = require('../models/Counter');
const Certificate = require('../models/Certificate');
const crypto = require('crypto');

// Helper to generate sequential Candidate ID
const generateCandidateId = async () => {
  const counter = await Counter.findByIdAndUpdate(
    'candidateId',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const year = new Date().getFullYear();
  const serial = String(counter.seq).padStart(4, '0');
  return `CYBER-${year}-${serial}`;
};

// Helper to generate sequential Certificate ID
const generateCertificateId = async () => {
  const counter = await Counter.findByIdAndUpdate(
    'certificateId',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const year = new Date().getFullYear();
  const serial = String(counter.seq).padStart(4, '0');
  return `CERT-${year}-${serial}`;
};

// Helper to shuffle array
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Sample balanced questions: 4 Easy, 4 Medium, 2 Hard
const sampleBalancedQuestions = async (questionCount = 10, randomizeOptions = true) => {
  // We want 4 Easy, 4 Medium, 2 Hard
  const easyCount = Math.round(questionCount * 0.4);
  const mediumCount = Math.round(questionCount * 0.4);
  const hardCount = questionCount - easyCount - mediumCount;

  // Query latest versions of active questions (grouped by questionId)
  const activeQuestions = await Question.aggregate([
    { $match: { isDeleted: false } },
    { $sort: { questionId: 1, version: -1 } },
    {
      $group: {
        _id: '$questionId',
        doc: { $first: '$$ROOT' }
      }
    },
    { $replaceRoot: { newRoot: '$doc' } }
  ]);

  const easyPool = activeQuestions.filter(q => q.difficulty === 'easy');
  const mediumPool = activeQuestions.filter(q => q.difficulty === 'medium');
  const hardPool = activeQuestions.filter(q => q.difficulty === 'hard');

  let selected = [];

  // Helper to draw random elements from a pool
  const draw = (pool, count) => {
    const shuffledPool = shuffle(pool);
    return shuffledPool.slice(0, count);
  };

  selected.push(...draw(easyPool, easyCount));
  selected.push(...draw(mediumPool, mediumCount));
  selected.push(...draw(hardPool, hardCount));

  // If pool deficiencies, fill up to required count from remaining questions
  if (selected.length < questionCount) {
    const selectedIds = new Set(selected.map(q => q._id.toString()));
    const remainingPool = activeQuestions.filter(q => !selectedIds.has(q._id.toString()));
    selected.push(...draw(remainingPool, questionCount - selected.length));
  }

  // Shuffle selected questions list
  selected = shuffle(selected);

  // Snapshot structure with option randomizing if needed
  return selected.map(q => {
    let options = [...q.options];
    if (randomizeOptions) {
      options = shuffle(options);
    }
    return {
      questionId: q.questionId,
      question: q.question,
      options,
      correctAnswer: q.correctAnswer,
      category: q.category,
      difficulty: q.difficulty
    };
  });
};

const registerCandidate = async (name, email, quizCode, ipInfo = {}) => {
  // Verify quiz exists and is active
  const quiz = await Quiz.findOne({ code: quizCode, isDeleted: false });
  if (!quiz) {
    throw new Error('Quiz not found or has been deleted.');
  }

  if (quiz.status !== 'Active') {
    throw new Error('This quiz is not currently active.');
  }

  const now = new Date();
  if (now < quiz.startDate || now > quiz.endDate) {
    throw new Error('This quiz is outside its scheduled activity dates.');
  }

  // Check/Create Candidate
  let candidate = await Candidate.findOne({ email: email.toLowerCase(), isDeleted: false });
  let candidateId;
  if (!candidate) {
    candidateId = await generateCandidateId();
    candidate = new Candidate({
      candidateId,
      name,
      email: email.toLowerCase()
    });
    await candidate.save();
  } else {
    candidateId = candidate.candidateId;
  }

  // Check existing attempts for this specific quiz
  const existingAttempt = await QuizAttempt.findOne({ quiz: quiz._id, candidate: candidate._id });
  if (existingAttempt) {
    if (['submitted', 'auto_submitted', 'disqualified'].includes(existingAttempt.status)) {
      throw new Error('You have already submitted this quiz and are not permitted a duplicate attempt.');
    }
    // If registered or in-progress, return this existing session for recovery
    return existingAttempt;
  }

  // Draw questions: use pinned pool if configured, else balanced random sample
  let questionsSnapshot;
  if (quiz.pinnedQuestions && quiz.pinnedQuestions.length > 0) {
    // Fetch the latest active version of each pinned questionId
    const pinnedDocs = await Question.aggregate([
      { $match: { questionId: { $in: quiz.pinnedQuestions }, isDeleted: false } },
      { $sort: { questionId: 1, version: -1 } },
      { $group: { _id: '$questionId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } }
    ]);

    // Shuffle and cap to questionCount
    let pool = shuffle(pinnedDocs);
    pool = pool.slice(0, quiz.questionCount);

    questionsSnapshot = pool.map(q => {
      let options = [...q.options];
      if (quiz.randomizeOptions) options = shuffle(options);
      return {
        questionId: q.questionId,
        question: q.question,
        options,
        correctAnswer: q.correctAnswer,
        category: q.category,
        difficulty: q.difficulty
      };
    });
  } else {
    questionsSnapshot = await sampleBalancedQuestions(quiz.questionCount, quiz.randomizeOptions);
  }

  if (questionsSnapshot.length === 0) {
    throw new Error('Unable to start quiz: Question bank is empty. Please contact an administrator.');
  }

  // Create attempt
  const attempt = new QuizAttempt({
    quiz: quiz._id,
    candidate: candidate._id,
    candidateId,
    candidateName: candidate.name,
    candidateEmail: candidate.email,
    status: 'registered',
    questions: questionsSnapshot,
    remainingTime: quiz.duration * 60, // in seconds
    ipAddress: ipInfo.ipAddress || 'Unknown',
    userAgent: ipInfo.userAgent || 'Unknown',
    deviceType: ipInfo.deviceType || 'Desktop',
    os: ipInfo.os || 'Unknown'
  });

  await attempt.save();
  return attempt;
};

const startQuiz = async (attemptId) => {
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) {
    throw new Error('Quiz attempt not found.');
  }

  if (attempt.status !== 'registered') {
    return attempt; // Already started
  }

  attempt.status = 'in_progress';
  attempt.startedAt = new Date();
  await attempt.save();
  return attempt;
};

const saveProgress = async (attemptId, { answers, currentQuestionIndex, remainingTime }) => {
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) {
    throw new Error('Quiz attempt not found.');
  }

  if (attempt.status !== 'in_progress') {
    throw new Error('Cannot save progress for an inactive session.');
  }

  // Update fields
  if (answers) {
    attempt.answers = answers;
  }
  if (currentQuestionIndex !== undefined) {
    attempt.currentQuestionIndex = currentQuestionIndex;
  }
  if (remainingTime !== undefined) {
    attempt.remainingTime = remainingTime;
  }

  await attempt.save();
  return attempt;
};

const submitQuiz = async (attemptId, status = 'submitted') => {
  const attempt = await QuizAttempt.findById(attemptId).populate('quiz');
  if (!attempt) {
    throw new Error('Quiz attempt not found.');
  }

  if (['submitted', 'auto_submitted', 'disqualified'].includes(attempt.status)) {
    return attempt; // Already graded
  }

  const quiz = attempt.quiz;
  const submittedAt = new Date();
  attempt.submittedAt = submittedAt;
  attempt.status = status;

  // Calculate elapsed time
  const startedAt = attempt.startedAt || attempt.createdAt;
  const elapsedSeconds = Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000);
  attempt.timeTaken = Math.min(elapsedSeconds, quiz.duration * 60);

  if (status === 'disqualified') {
    attempt.score = 0;
    attempt.percentage = 0;
    attempt.passOrFail = 'Fail';
    attempt.remainingTime = 0;
    await attempt.save();
    return attempt;
  }

  // Calculate score based on snapshot questions
  let correctCount = 0;
  attempt.questions.forEach((qSnapshot) => {
    const questionIdStr = qSnapshot.questionId.toString();
    const candidateAnswer = attempt.answers.get(questionIdStr);
    if (candidateAnswer && candidateAnswer.trim() === qSnapshot.correctAnswer.trim()) {
      correctCount++;
    }
  });

  const totalQuestions = attempt.questions.length;
  const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  attempt.score = correctCount;
  attempt.percentage = Math.round(scorePercentage);
  attempt.passOrFail = scorePercentage >= quiz.passingPercentage ? 'Pass' : 'Fail';
  attempt.remainingTime = 0;

  // Generate certificate if passed
  if (attempt.passOrFail === 'Pass') {
    const certificateId = await generateCertificateId();
    attempt.certificateId = certificateId;

    const certHash = crypto.createHash('sha256')
      .update(`${certificateId}-${attempt.candidateId}-${attempt.score}-${submittedAt.getTime()}`)
      .digest('hex');

    const certificate = new Certificate({
      certificateId,
      attempt: attempt._id,
      candidateName: attempt.candidateName,
      candidateId: attempt.candidateId,
      quizName: quiz.title,
      score: correctCount,
      percentage: Math.round(scorePercentage),
      completionDate: submittedAt,
      hash: certHash
    });

    await certificate.save();
  }

  await attempt.save();
  return attempt;
};

const resumeQuiz = async (attemptId) => {
  const attempt = await QuizAttempt.findById(attemptId).populate('quiz');
  if (!attempt) {
    throw new Error('Quiz attempt not found.');
  }

  if (['submitted', 'auto_submitted', 'disqualified'].includes(attempt.status)) {
    return attempt; // Let the controller format the result response
  }

  // Verify time is still remaining based on real-time elapsed since startedAt
  if (attempt.status === 'in_progress' && attempt.startedAt) {
    const quizDurationSec = attempt.quiz.duration * 60;
    const elapsedSec = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    const calculatedRemaining = quizDurationSec - elapsedSec;

    if (calculatedRemaining <= 0) {
      // Auto submit immediately on database level
      return await submitQuiz(attemptId, 'auto_submitted');
    }
    
    // Choose minimum of calculating remaining time and stored remaining time to prevent clock adjustments
    attempt.remainingTime = Math.min(attempt.remainingTime, calculatedRemaining);
    await attempt.save();
  }

  return attempt;
};

const addViolation = async (attemptId, { violationType, currentQuestionNumber, remainingTime }) => {
  const attempt = await QuizAttempt.findById(attemptId).populate('quiz');
  if (!attempt) {
    throw new Error('Quiz attempt not found.');
  }

  if (attempt.status !== 'in_progress') {
    throw new Error('Cannot log violations on an inactive quiz.');
  }

  attempt.violationDetails.push({
    violationType,
    currentQuestionNumber,
    remainingTime,
    timestamp: new Date()
  });

  attempt.violationCount = attempt.violationDetails.length;

  // Check if exceeds limit
  const limit = attempt.quiz.violationLimit;
  if (attempt.violationCount >= limit) {
    // Disqualify candidate!
    return await submitQuiz(attemptId, 'disqualified');
  }

  await attempt.save();
  return attempt;
};

module.exports = {
  registerCandidate,
  startQuiz,
  saveProgress,
  submitQuiz,
  resumeQuiz,
  addViolation
};
