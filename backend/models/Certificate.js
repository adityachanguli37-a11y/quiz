const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  attempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizAttempt',
    required: true
  },
  candidateName: {
    type: String,
    required: true
  },
  candidateId: {
    type: String,
    required: true
  },
  quizName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  completionDate: {
    type: Date,
    default: Date.now
  },
  hash: {
    type: String,
    required: true,
    unique: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

CertificateSchema.index({ certificateId: 1, isDeleted: 1 });

module.exports = mongoose.model('Certificate', CertificateSchema);
