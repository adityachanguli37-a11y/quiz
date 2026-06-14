require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Initialize database
connectDB();

const app = express();
const server = http.createServer(app);

const checkOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  
  const clientUrl = process.env.CLIENT_URL;
  const normalizedClientUrl = clientUrl ? clientUrl.replace(/\/$/, '') : null;
  
  if (
    origin === normalizedClientUrl ||
    origin.endsWith('.vercel.app') ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')
  ) {
    return callback(null, true);
  }
  
  return callback(new Error('Not allowed by CORS'), false);
};

// Setup Socket.IO
const io = socketIo(server, {
  cors: {
    origin: checkOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Attach socket io instance to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO Connection Event Handler
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('join_admin_room', () => {
    socket.join('admin_notifications');
    console.log(`Socket ${socket.id} joined admin room`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: checkOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount Routes
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/candidates', require('./routes/candidateRoutes'));
app.use('/api/quiz-attempts', require('./routes/quizAttemptRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Root endpoint redirect or hello
app.get('/', (req, res) => {
  res.json({ message: 'Cybersecurity Awareness Quiz Platform API' });
});

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = { app, server, io };
