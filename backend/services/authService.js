const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const generateTokens = (admin) => {
  const payload = { id: admin._id, username: admin.username, role: admin.role };
  
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'local_jwt_access_secret_security_key_development_only_1234',
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'local_jwt_refresh_secret_security_key_development_only_1234',
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  // Access Token: HTTP-only, secure, same-site strict, expires in 15 mins
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  // Refresh Token: HTTP-only, secure, same-site strict, expires in 7 days
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

const clearTokenCookies = (res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

const verifyToken = (token, isRefresh = false) => {
  const secret = isRefresh 
    ? (process.env.JWT_REFRESH_SECRET || 'local_jwt_refresh_secret_security_key_development_only_1234')
    : (process.env.JWT_ACCESS_SECRET || 'local_jwt_access_secret_security_key_development_only_1234');
  
  return jwt.verify(token, secret);
};

module.exports = {
  generateTokens,
  setTokenCookies,
  clearTokenCookies,
  verifyToken
};
