const validateRegistration = (req, res, next) => {
  const { name, email, quizCode } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Full name is required.' });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.toLowerCase().trim())) {
    return res.status(400).json({ message: 'Invalid email address format.' });
  }

  if (!quizCode || !quizCode.trim()) {
    return res.status(400).json({ message: 'Quiz Access Code is required.' });
  }

  next();
};

const validateAdminLogin = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ message: 'Username is required.' });
  }

  if (!password || !password.trim()) {
    return res.status(400).json({ message: 'Password is required.' });
  }

  next();
};

const validateQuestion = (req, res, next) => {
  const { question, options, correctAnswer, category, difficulty } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ message: 'Question text is required.' });
  }

  if (!options || !Array.isArray(options) || options.length !== 4) {
    return res.status(400).json({ message: 'Question must contain exactly 4 options.' });
  }

  const trimmedOptions = options.map(o => o.toString().trim());
  if (trimmedOptions.some(o => !o)) {
    return res.status(400).json({ message: 'Options cannot contain empty strings.' });
  }

  if (!correctAnswer || !correctAnswer.trim()) {
    return res.status(400).json({ message: 'Correct answer is required.' });
  }

  if (!trimmedOptions.includes(correctAnswer.trim())) {
    return res.status(400).json({ message: 'Correct answer must match one of the 4 options exactly.' });
  }

  if (!category || !category.trim()) {
    return res.status(400).json({ message: 'Category is required.' });
  }

  if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty.toLowerCase().trim())) {
    return res.status(400).json({ message: 'Difficulty must be "easy", "medium", or "hard".' });
  }

  next();
};

const validateQuiz = (req, res, next) => {
  const { title, code, startDate, endDate, duration, passingPercentage, questionCount } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Quiz title is required.' });
  }

  if (!code || !code.trim()) {
    return res.status(400).json({ message: 'Quiz entry code is required.' });
  }

  if (!startDate) {
    return res.status(400).json({ message: 'Quiz Start Date is required.' });
  }

  if (!endDate) {
    return res.status(400).json({ message: 'Quiz End Date is required.' });
  }

  if (new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({ message: 'Quiz Start Date cannot be after the End Date.' });
  }

  if (duration === undefined || Number(duration) <= 0) {
    return res.status(400).json({ message: 'Quiz duration must be greater than 0 minutes.' });
  }

  if (passingPercentage === undefined || Number(passingPercentage) < 0 || Number(passingPercentage) > 100) {
    return res.status(400).json({ message: 'Quiz passing percentage must be between 0 and 100.' });
  }

  if (questionCount === undefined || Number(questionCount) <= 0) {
    return res.status(400).json({ message: 'Question count per attempt must be greater than 0.' });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateAdminLogin,
  validateQuestion,
  validateQuiz
};
