const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const QuizAttempt = require('../models/QuizAttempt');
const { generateTokens, setTokenCookies, clearTokenCookies } = require('../services/authService');
const { getDashboardStats } = require('../services/statsService');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username: username.toLowerCase() });
    
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const { accessToken, refreshToken } = generateTokens(admin);
    admin.refreshToken = refreshToken;
    await admin.save();

    setTokenCookies(res, accessToken, refreshToken);

    // Create Audit Log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: admin.username,
      action: 'ADMIN_LOGIN',
      ipAddress,
      metadata: { userAgent: req.headers['user-agent'] }
    });

    res.json({
      username: admin.username,
      role: admin.role,
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.admin) {
      const admin = await Admin.findById(req.admin.id);
      if (admin) {
        admin.refreshToken = null;
        await admin.save();
      }

      // Create Audit Log
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
      await AuditLog.create({
        admin: req.admin.username,
        action: 'ADMIN_LOGOUT',
        ipAddress
      });
    }

    clearTokenCookies(res);
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

const verifySession = async (req, res, next) => {
  try {
    res.json({
      username: req.admin.username,
      role: req.admin.role
    });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({
      status: { $in: ['submitted', 'auto_submitted'] },
      isDeleted: false
    })
      .sort({ score: -1, percentage: -1, timeTaken: 1 })
      .limit(50)
      .select('candidateId score percentage passOrFail submittedAt');

    res.json(attempts);
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(100);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  verifySession,
  getStats,
  getLeaderboard,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAuditLogs
};
