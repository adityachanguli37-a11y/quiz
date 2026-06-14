const quizService = require('../services/quizService');
const { sendRegistrationEmail } = require('../services/emailService');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Candidate = require('../models/Candidate');
const Notification = require('../models/Notification');

// Utility to parse UA string
const parseUserAgent = (uaString) => {
  let os = 'Unknown';
  let deviceType = 'Desktop';

  if (!uaString) return { os, deviceType };

  if (/windows/i.test(uaString)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(uaString)) os = 'macOS';
  else if (/linux/i.test(uaString)) os = 'Linux';
  else if (/android/i.test(uaString)) os = 'Android';
  else if (/iphone|ipad/i.test(uaString)) os = 'iOS';

  if (/mobile|android|iphone|ipad|phone/i.test(uaString)) {
    deviceType = 'Mobile';
  }
  return { os, deviceType };
};

const register = async (req, res, next) => {
  try {
    const { name, email, quizCode } = req.body;
    
    // User Agent / Metadata parsing
    const userAgent = req.headers['user-agent'] || '';
    const { os, deviceType } = parseUserAgent(userAgent);
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';

    const attempt = await quizService.registerCandidate(name, email.toLowerCase(), quizCode.toUpperCase(), {
      ipAddress,
      userAgent,
      os,
      deviceType
    });

    const quiz = await Quiz.findById(attempt.quiz);

    // Send confirmation email asynchronously
    sendRegistrationEmail(email, {
      name,
      candidateId: attempt.candidateId,
      quizTitle: quiz.title,
      duration: quiz.duration,
      passingPercentage: quiz.passingPercentage,
      violationLimit: quiz.violationLimit
    });

    // Real-time admin notification
    const notification = await Notification.create({
      title: 'New Candidate Registered',
      message: `${name} has registered for quiz: ${quiz.title} (${attempt.candidateId})`,
      type: 'candidate_complete',
      createdAt: new Date()
    });
    
    if (req.io) {
      req.io.to('admin_notifications').emit('new_notification', notification);
    }

    res.status(201).json({
      attemptId: attempt._id,
      candidateId: attempt.candidateId,
      candidateName: attempt.candidateName,
      candidateEmail: attempt.candidateEmail,
      quizTitle: quiz.title,
      duration: quiz.duration,
      passingPercentage: quiz.passingPercentage,
      violationLimit: quiz.violationLimit,
      fullscreenRequirement: quiz.fullscreenRequirement,
      status: attempt.status
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const start = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const attempt = await quizService.startQuiz(attemptId);

    // Security: Filter out correct answers from questions before sending to client!
    const sanitizedQuestions = attempt.questions.map(q => ({
      questionId: q.questionId,
      question: q.question,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty
    }));

    res.json({
      attemptId: attempt._id,
      questions: sanitizedQuestions,
      currentQuestionIndex: attempt.currentQuestionIndex,
      answers: attempt.answers,
      remainingTime: attempt.remainingTime,
      status: attempt.status,
      startedAt: attempt.startedAt
    });
  } catch (error) {
    next(error);
  }
};

const autosave = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { answers, currentQuestionIndex, remainingTime } = req.body;

    const attempt = await quizService.saveProgress(attemptId, {
      answers,
      currentQuestionIndex,
      remainingTime
    });

    res.json({ success: true, remainingTime: attempt.remainingTime });
  } catch (error) {
    next(error);
  }
};

const logViolation = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { violationType, currentQuestionNumber, remainingTime } = req.body;

    const attempt = await quizService.addViolation(attemptId, {
      violationType,
      currentQuestionNumber,
      remainingTime
    });

    if (attempt.status === 'disqualified') {
      // Create admin notification
      const notification = await Notification.create({
        title: 'Candidate Disqualified',
        message: `${attempt.candidateName} (${attempt.candidateId}) exceeded the cheating violation limit and was disqualified.`,
        type: 'candidate_disqualified',
        createdAt: new Date()
      });
      if (req.io) {
        req.io.to('admin_notifications').emit('new_notification', notification);
      }

      return res.json({
        message: 'Quiz auto-submitted due to excessive violations.',
        status: attempt.status,
        violationCount: attempt.violationCount
      });
    }

    res.json({
      success: true,
      violationCount: attempt.violationCount
    });
  } catch (error) {
    next(error);
  }
};

const submit = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { isAutoSubmit } = req.body;

    const status = isAutoSubmit ? 'auto_submitted' : 'submitted';
    const attempt = await quizService.submitQuiz(attemptId, status);
    const quiz = await Quiz.findById(attempt.quiz);

    // Create Notification
    const notification = await Notification.create({
      title: 'Quiz Submitted',
      message: `${attempt.candidateName} (${attempt.candidateId}) completed ${quiz.title} with score: ${attempt.score}/${attempt.questions.length} (${attempt.percentage}%) - ${attempt.passOrFail}`,
      type: 'candidate_complete',
      createdAt: new Date()
    });
    
    if (req.io) {
      req.io.to('admin_notifications').emit('new_notification', notification);
    }

    res.json({
      candidateName: attempt.candidateName,
      candidateId: attempt.candidateId,
      score: attempt.score,
      percentage: attempt.percentage,
      passOrFail: attempt.passOrFail,
      status: attempt.status,
      certificateId: attempt.certificateId,
      submittedAt: attempt.submittedAt
    });
  } catch (error) {
    next(error);
  }
};

const resume = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const attempt = await quizService.resumeQuiz(attemptId);

    if (['submitted', 'auto_submitted', 'disqualified'].includes(attempt.status)) {
      // attempt.quiz is already populated by resumeQuiz's .populate('quiz')
      const quizDoc = attempt.quiz;
      return res.json({
        status: attempt.status,
        candidateName: attempt.candidateName,
        candidateId: attempt.candidateId,
        score: attempt.score,
        percentage: attempt.percentage,
        passOrFail: attempt.passOrFail,
        certificateId: attempt.certificateId,
        violationCount: attempt.violationCount,
        timeTaken: attempt.timeTaken,
        questions: attempt.questions,
        quiz: quizDoc ? { title: quizDoc.title } : null
      });
    }

    const sanitizedQuestions = attempt.questions.map(q => ({
      questionId: q.questionId,
      question: q.question,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty
    }));

    res.json({
      attemptId: attempt._id,
      questions: sanitizedQuestions,
      currentQuestionIndex: attempt.currentQuestionIndex,
      answers: attempt.answers,
      remainingTime: attempt.remainingTime,
      status: attempt.status,
      startedAt: attempt.startedAt
    });
  } catch (error) {
    next(error);
  }
};

// Admin attempt review detailed endpoint
const getAttemptDetailsForReview = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const attempt = await QuizAttempt.findById(attemptId).populate('quiz', 'title code');
    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found.' });
    }
    res.json(attempt);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  start,
  autosave,
  logViolation,
  submit,
  resume,
  getAttemptDetailsForReview
};
