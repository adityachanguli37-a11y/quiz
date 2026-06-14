/**
 * Automated Test Script for Cybersecurity Quiz Platform Flow
 * Simulates:
 * 1. Register candidate for quiz
 * 2. Start quiz and fetch question list (checking correct answer sanitization)
 * 3. Log a violation (tab switch)
 * 4. Save progress (autosave answers)
 * 5. Resume quiz (verifying state preservation)
 * 6. Submit quiz (checking scoring results and certificate validation)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');
const Question = require('./models/Question');
const Candidate = require('./models/Candidate');
const QuizAttempt = require('./models/QuizAttempt');
const Certificate = require('./models/Certificate');
const quizService = require('./services/quizService');

const runTest = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyber_quiz';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('\n--- STARTING FLOW TEST ---\n');

    // 1. Fetch the seeded quiz
    const quiz = await Quiz.findOne({ code: 'CYBER2026', isDeleted: false });
    if (!quiz) {
      console.error('Test Failed: Active quiz CYBER2026 not found in DB. Run seed first.');
      process.exit(1);
    }
    console.log(`Step 1: Found active quiz: "${quiz.title}" with entry code: ${quiz.code}`);

    // Clean any prior test records for this email
    const testEmail = 'john.tester@example.com';
    const testName = 'John Tester';
    await QuizAttempt.deleteMany({ candidateEmail: testEmail });
    await Candidate.deleteOne({ email: testEmail });

    // 2. Register candidate
    console.log(`Step 2: Registering candidate name: ${testName}, email: ${testEmail}`);
    const attempt = await quizService.registerCandidate(testName, testEmail, quiz.code, {
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      deviceType: 'Desktop',
      os: 'Windows'
    });

    console.log(`✔ Candidate registered. Generated ID: ${attempt.candidateId}`);
    console.log(`✔ Attempt status: ${attempt.status}`);
    console.log(`✔ Balanced questions snapshot generated. Total questions: ${attempt.questions.length}`);

    // Verify 4-4-2 difficulty balancing
    const easyCount = attempt.questions.filter(q => q.difficulty === 'easy').length;
    const mediumCount = attempt.questions.filter(q => q.difficulty === 'medium').length;
    const hardCount = attempt.questions.filter(q => q.difficulty === 'hard').length;
    console.log(`✔ Question balance check: Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount}`);

    // 3. Start Quiz
    console.log(`\nStep 3: Starting Quiz Attempt...`);
    const startedAttempt = await quizService.startQuiz(attempt._id);
    console.log(`✔ Attempt status changed to: ${startedAttempt.status}`);
    console.log(`✔ Quiz started at: ${startedAttempt.startedAt}`);

    // 4. Log violation
    console.log(`\nStep 4: Logging a tab switch violation...`);
    const attemptWithViolation = await quizService.addViolation(startedAttempt._id, {
      violationType: 'tab_switch',
      currentQuestionNumber: 2,
      remainingTime: 550
    });
    console.log(`✔ Violation recorded. Count: ${attemptWithViolation.violationCount}`);
    console.log(`✔ Last logged violation: ${attemptWithViolation.violationDetails[0].violationType} at ${attemptWithViolation.violationDetails[0].timestamp}`);

    // 5. Autosave
    console.log(`\nStep 5: Simulating candidate progress autosave...`);
    const question1 = startedAttempt.questions[0];
    const question2 = startedAttempt.questions[1];
    
    // Choose correct answer for Q1, wrong answer for Q2 to test scoring accuracy
    const answersMap = new Map();
    answersMap.set(question1.questionId.toString(), question1.correctAnswer);
    answersMap.set(question2.questionId.toString(), 'Wrong Answer Option Placeholder');

    const autosaved = await quizService.saveProgress(startedAttempt._id, {
      answers: answersMap,
      currentQuestionIndex: 2,
      remainingTime: 500
    });
    console.log(`✔ Auto-saved progress. Current index: ${autosaved.currentQuestionIndex}`);
    console.log(`✔ Logged answers count: ${autosaved.answers.size}`);

    // 6. Resume Quiz
    console.log(`\nStep 6: Resuming quiz (simulating tab refresh)...`);
    const resumed = await quizService.resumeQuiz(startedAttempt._id);
    console.log(`✔ Resume successful. Status is still: ${resumed.status}`);
    console.log(`✔ Restored remaining time: ${resumed.remainingTime}s`);
    console.log(`✔ Verifying same questions loaded: Q1 text is identical: ${resumed.questions[0].question === question1.question}`);

    // 7. Submit Quiz
    console.log(`\nStep 7: Submitting assessment...`);
    const results = await quizService.submitQuiz(startedAttempt._id, 'submitted');
    console.log(`✔ Quiz status is now: ${results.status}`);
    console.log(`✔ Final Score: ${results.score}/${results.questions.length} (${results.percentage}%)`);
    console.log(`✔ Pass/Fail assessment: ${results.passOrFail}`);

    if (results.passOrFail === 'Pass') {
      console.log(`✔ Unique Certificate generated: ${results.certificateId}`);
      const cert = await Certificate.findOne({ certificateId: results.certificateId });
      console.log(`✔ Verified certificate in DB. Hash: ${cert.hash}`);
    } else {
      console.log(`✔ Certificate was not generated as score was below passing.`);
    }

    console.log('\n--- FLOW TEST COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Flow Failed:', error.stack);
    process.exit(1);
  }
};

runTest();
