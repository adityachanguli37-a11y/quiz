const mongoose = require('mongoose');

const QuestionSnapshotSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true
  },
  correctAnswer: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  }
}, { _id: false });

const ViolationDetailSchema = new mongoose.Schema({
  violationType: {
    type: String,
    enum: ['tab_switch', 'fullscreen_exit', 'devtools_detected', 'copy_attempt', 'paste_attempt', 'right_click', 'shortcut_usage'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  currentQuestionNumber: {
    type: Number
  },
  remainingTime: {
    type: Number // in seconds
  }
}, { _id: false });

const QuizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  candidateId: {
    type: String,
    required: true
  },
  candidateName: {
    type: String,
    required: true
  },
  candidateEmail: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['registered', 'in_progress', 'submitted', 'auto_submitted', 'disqualified', 'abandoned'],
    default: 'registered'
  },
  questions: [QuestionSnapshotSchema],
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  // Key: questionId (as String), Value: selected answer text
  answers: {
    type: Map,
    of: String,
    default: {}
  },
  score: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  passOrFail: {
    type: String,
    enum: ['Pass', 'Fail', 'N/A'],
    default: 'N/A'
  },
  timeTaken: {
    type: Number, // in seconds
    default: 0
  },
  remainingTime: {
    type: Number // in seconds
  },
  violationCount: {
    type: Number,
    default: 0
  },
  violationDetails: [ViolationDetailSchema],
  startedAt: {
    type: Date
  },
  submittedAt: {
    type: Date
  },
  certificateId: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  deviceType: {
    type: String
  },
  os: {
    type: String
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for searching, sorting, and metrics dashboard
QuizAttemptSchema.index({ quiz: 1, candidateEmail: 1 }, { unique: true });
QuizAttemptSchema.index({ status: 1 });
QuizAttemptSchema.index({ isDeleted: 1 });
QuizAttemptSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
