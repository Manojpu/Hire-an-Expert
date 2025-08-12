const jwt = require('jsonwebtoken');
const axios = require('axios');

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No authorization header provided',
      timestamp: new Date().toISOString()
    });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No token provided',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // For Firebase tokens, we'll validate with the auth service
    validateTokenWithAuthService(token)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch((error) => {
        console.error('Token validation failed:', error.message);
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
          timestamp: new Date().toISOString()
        });
      });
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token validation failed',
      timestamp: new Date().toISOString()
    });
  }
};

// Validate token with auth service
async function validateTokenWithAuthService(token) {
  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
    const response = await axios.post(`${authServiceUrl}/ping`, {}, {
      headers: {
        'authorization': token,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    return { userId: response.data };
  } catch (error) {
    throw new Error('Token validation failed');
  }
}

// Optional authentication (for public endpoints that can work with or without auth)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next(); // Continue without authentication
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  if (!token) {
    return next(); // Continue without authentication
  }

  // Try to validate, but don't fail if invalid
  validateTokenWithAuthService(token)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((error) => {
      console.warn('Optional auth failed:', error.message);
      next(); // Continue without authentication
    });
};

module.exports = {
  authenticateJWT,
  optionalAuth
};
