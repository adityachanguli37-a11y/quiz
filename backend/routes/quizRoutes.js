const express = require('express');
const router = express.Router();
const quizAdminController = require('../controllers/quizAdminController');
const { protect } = require('../middleware/authMiddleware');
const { validateQuiz } = require('../middleware/validationMiddleware');

router.get('/', protect, quizAdminController.getQuizzes);
router.get('/:id', protect, quizAdminController.getQuizById);
router.post('/', protect, validateQuiz, quizAdminController.createQuiz);
router.put('/:id', protect, validateQuiz, quizAdminController.updateQuiz);
router.patch('/:id/toggle-status', protect, quizAdminController.toggleStatus);
router.delete('/:id', protect, quizAdminController.deleteQuiz);

module.exports = router;
