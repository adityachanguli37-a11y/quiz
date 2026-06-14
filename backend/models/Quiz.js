const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Archived'],
    default: 'Draft'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    default: 10
  },
  passingPercentage: {
    type: Number,
    required: true,
    default: 70
  },
  questionCount: {
    type: Number,
    required: true,
    default: 10
  },
  randomizeQuestions: {
    type: Boolean,
    default: true
  },
  randomizeOptions: {
    type: Boolean,
    default: true
  },
  fullscreenRequirement: {
    type: Boolean,
    default: true
  },
  violationLimit: {
    type: Number,
    default: 3
  },
  autoSubmitEnabled: {
    type: Boolean,
    default: true
  },
  // Optional curated question pool. Empty = random balanced from full bank.
  pinnedQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index to search by code quickly and support soft-deletes
QuizSchema.index({ code: 1, isDeleted: 1 });

module.exports = mongoose.model('Quiz', QuizSchema);
