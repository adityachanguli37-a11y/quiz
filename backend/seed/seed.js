require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Candidate = require('../models/Candidate');
const Certificate = require('../models/Certificate');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const SystemSettings = require('../models/SystemSettings');
const Counter = require('../models/Counter');
const questionsData = require('./questionsSeedData');

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyber_quiz';
    console.log(`Connecting to database to seed: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing database collections...');
    await Admin.deleteMany({});
    await Question.deleteMany({});
    await Quiz.deleteMany({});
    await QuizAttempt.deleteMany({});
    await Candidate.deleteMany({});
    await Certificate.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});
    await SystemSettings.deleteMany({});
    await Counter.deleteMany({});

    console.log('Seeding System Settings...');
    const sysSettings = new SystemSettings({
      key: 'system_config',
      retentionDays: 30,
      backupFrequency: 'daily'
    });
    await sysSettings.save();

    console.log('Seeding Default Counter sequences...');
    await Counter.create([
      { _id: 'candidateId', seq: 0 },
      { _id: 'certificateId', seq: 0 }
    ]);

    console.log('Seeding Administrator...');
    const defaultAdmin = new Admin({
      username: 'admin',
      password: 'adminPassword123', // Will be automatically hashed by Admin pre-save hook
      role: 'admin'
    });
    await defaultAdmin.save();
    console.log('Admin account created: admin / adminPassword123');

    console.log('Seeding 50 balanced questions...');
    const questionsToInsert = questionsData.map(q => ({
      ...q,
      questionId: new mongoose.Types.ObjectId(),
      version: 1,
      updatedBy: 'admin'
    }));
    await Question.insertMany(questionsToInsert);
    console.log(`Successfully seeded ${questionsToInsert.length} questions.`);

    console.log('Seeding Quizzes...');
    const now = new Date();
    
    const activeQuiz = new Quiz({
      title: 'Cybersecurity General Assessment 2026',
      description: 'Comprehensive evaluation covering network security, safe browsing, data protection, and password configurations.',
      code: 'CYBER2026',
      status: 'Active',
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Started yesterday
      endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),  // Active for 60 days
      duration: 10, // 10 minutes
      passingPercentage: 70, // 70%
      questionCount: 10,
      randomizeQuestions: true,
      randomizeOptions: true,
      fullscreenRequirement: true,
      violationLimit: 3,
      autoSubmitEnabled: true
    });

    const activePhishingQuiz = new Quiz({
      title: 'Phishing & Social Engineering Assessment',
      description: 'A focused training assessment assessing email spoofing, whaling, baiting, and tailgating warning signs.',
      code: 'PHISH2026',
      status: 'Active',
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Active for 30 days
      duration: 15,
      passingPercentage: 80,
      questionCount: 10,
      randomizeQuestions: true,
      randomizeOptions: true,
      fullscreenRequirement: true,
      violationLimit: 3,
      autoSubmitEnabled: true
    });

    const scheduledQuiz = new Quiz({
      title: 'Employee Cyber Security Training Quiz',
      description: 'Scheduled evaluation for security awareness training programs.',
      code: 'TRAIN2026',
      status: 'Draft',
      startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // Starts in 5 days
      endDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      duration: 12,
      passingPercentage: 75,
      questionCount: 10,
      randomizeQuestions: true,
      randomizeOptions: true,
      fullscreenRequirement: true,
      violationLimit: 3,
      autoSubmitEnabled: true
    });

    await activeQuiz.save();
    await activePhishingQuiz.save();
    await scheduledQuiz.save();
    console.log('Seeded 3 assessments (CYBER2026 - Active, PHISH2026 - Active, TRAIN2026 - Scheduled/Draft).');

    console.log('Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding database failed:', error.message);
    process.exit(1);
  }
};

seedDB();
