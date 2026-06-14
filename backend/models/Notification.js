const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['candidate_complete', 'import_success', 'import_fail', 'settings_changed', 'candidate_disqualified'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto delete notification older than 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', NotificationSchema);
