const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { verifyToken, generateTokens, setTokenCookies } = require('../services/authService');

const protect = async (req, res, next) => {
  let accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  try {
    // 1. Try to verify Access Token
    if (accessToken) {
      const decoded = verifyToken(accessToken, false);
      req.admin = decoded;
      return next();
    }
  } catch (error) {
    console.log('Access token verification failed, trying refresh token...');
  }

  // 2. Access Token expired/invalid, try Refresh Token
  if (!refreshToken) {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }

  try {
    const decoded = verifyToken(refreshToken, true);
    
    // Check if admin still exists and token matches
    const admin = await Admin.findById(decoded.id);
    if (!admin || admin.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid session. Please log in again.' });
    }

    // Generate new token pair
    const tokens = generateTokens(admin);
    admin.refreshToken = tokens.refreshToken;
    await admin.save();

    // Set new cookies
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    req.admin = { id: admin._id, username: admin.username, role: admin.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};

module.exports = { protect };
