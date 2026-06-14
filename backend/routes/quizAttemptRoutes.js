const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { searchAttempts } = require('../services/statsService');
const { protect } = require('../middleware/authMiddleware');
const { validateRegistration } = require('../middleware/validationMiddleware');
const { quizRegistrationLimiter } = require('../middleware/securityMiddleware');

// Candidate routes
router.post('/register', quizRegistrationLimiter, validateRegistration, quizController.register);
router.post('/:attemptId/start', quizController.start);
router.post('/:attemptId/autosave', quizController.autosave);
router.post('/:attemptId/violation', quizController.logViolation);
router.post('/:attemptId/submit', quizController.submit);
router.get('/:attemptId/resume', quizController.resume);

// Admin-only routes
router.get('/:attemptId/review', protect, quizController.getAttemptDetailsForReview);

router.get('/', protect, async (req, res, next) => {
  try {
    const { 
      search, quizId, status, passOrFail, minScore, maxScore, 
      startDate, endDate, page, limit, sortBy, sortOrder 
    } = req.query;
    
    const results = await searchAttempts({
      search, quizId, status, passOrFail, minScore, maxScore, startDate, endDate, sortBy, sortOrder
    }, page, limit);
    
    res.json(results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
