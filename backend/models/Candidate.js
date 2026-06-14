const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  candidateId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for quick lookup
CandidateSchema.index({ email: 1 });
CandidateSchema.index({ candidateId: 1 });

module.exports = mongoose.model('Candidate', CandidateSchema);
