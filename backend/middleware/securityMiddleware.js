const rateLimit = require('express-rate-limit');

// General rate limiter for all candidate endpoints (max 100 requests per 15 minutes)
const candidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: {
    message: 'Too many requests from this client. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for registration / start (max 15 requests per 15 minutes to prevent spam)
const quizRegistrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    message: 'Too many quiz registrations from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for admin login (max 5 requests per 15 minutes)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: 'Too many admin authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  candidateLimiter,
  quizRegistrationLimiter,
  adminLoginLimiter
};
