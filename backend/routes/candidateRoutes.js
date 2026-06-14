const express = require('express');
const router = express.Router();
const multer = require('multer');
const candidateController = require('../controllers/candidateController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', protect, candidateController.getCandidates);
router.delete('/:id', protect, candidateController.deleteCandidate);
router.post('/import', protect, upload.single('file'), candidateController.bulkImportCandidates);

module.exports = router;
