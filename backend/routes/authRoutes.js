const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { validateAdminLogin } = require('../middleware/validationMiddleware');
const { adminLoginLimiter } = require('../middleware/securityMiddleware');

router.post('/login', adminLoginLimiter, validateAdminLogin, adminController.login);
router.post('/logout', protect, adminController.logout);
router.get('/session', protect, adminController.verifySession);
router.get('/stats', protect, adminController.getStats);
router.get('/leaderboard', adminController.getLeaderboard); // Publicly viewable rankings (emails masked)
router.get('/audit-logs', protect, adminController.getAuditLogs);

module.exports = router;
