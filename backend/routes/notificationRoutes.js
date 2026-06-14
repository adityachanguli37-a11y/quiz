const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, adminController.getNotifications);
router.put('/:id/read', protect, adminController.markNotificationRead);
router.put('/read-all', protect, adminController.markAllNotificationsRead);

module.exports = router;
