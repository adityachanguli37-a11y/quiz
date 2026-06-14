const express = require('express');
const router = express.Router();
const multer = require('multer');
const questionController = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');
const { validateQuestion } = require('../middleware/validationMiddleware');

// Multer in-memory upload configurations
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.get('/', protect, questionController.getQuestions);
router.get('/:id', protect, questionController.getQuestionById);
router.post('/', protect, validateQuestion, questionController.createQuestion);
router.put('/:id', protect, validateQuestion, questionController.updateQuestion);
router.delete('/:id', protect, questionController.deleteQuestion);
router.get('/:id/history', protect, questionController.getVersionHistory);

// Bulk excel upload route
router.post('/import', protect, upload.single('file'), questionController.bulkImport);

module.exports = router;
