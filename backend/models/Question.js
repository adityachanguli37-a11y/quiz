const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  // Identifies a question logically across multiple versions
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    default: () => new mongoose.Types.ObjectId(),
    index: true
  },
  version: {
    type: Number,
    required: true,
    default: 1
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length === 4;
      },
      message: 'A question must have exactly 4 options.'
    }
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Indexes for optimized selection (e.g. balancing categories and difficulties)
QuestionSchema.index({ difficulty: 1, category: 1, isDeleted: 1 });
QuestionSchema.index({ questionId: 1, version: -1 });

module.exports = mongoose.model('Question', QuestionSchema);
