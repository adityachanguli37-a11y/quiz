const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, settingsController.getSystemSettings);
router.put('/', protect, settingsController.updateSystemSettings);
router.get('/backup', protect, settingsController.downloadBackup);
router.get('/export/excel', protect, settingsController.exportExcelAttempts);
router.get('/export/csv', protect, settingsController.exportCSVAttempts);

module.exports = router;
