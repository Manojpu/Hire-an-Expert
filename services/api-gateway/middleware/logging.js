const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  const requestLog = {
    timestamp,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    userId: req.user?.userId || 'anonymous'
  };

  console.log(`📝 [${timestamp}] ${req.method} ${req.originalUrl} - ${requestLog.ip}`);

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    const responseLog = {
      ...requestLog,
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length'),
      duration: `${duration}ms`,
      success: res.statusCode < 400
    };

    // Log response
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    console.log(`📊 [${timestamp}] ${logLevel} ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);

    // Write to file (optional - for production)
    if (process.env.NODE_ENV === 'production') {
      const logEntry = JSON.stringify(responseLog) + '\n';
      const logFile = path.join(logsDir, `requests-${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFile(logFile, logEntry, (err) => {
        if (err) console.error('Failed to write log:', err);
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  
  const errorLog = {
    timestamp,
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId || 'anonymous'
    }
  };

  console.error(`❌ [${timestamp}] ERROR ${req.method} ${req.originalUrl}:`, err.message);

  // Write error to file (optional - for production)
  if (process.env.NODE_ENV === 'production') {
    const logEntry = JSON.stringify(errorLog) + '\n';
    const logFile = path.join(logsDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFile(logFile, logEntry, (err) => {
      if (err) console.error('Failed to write error log:', err);
    });
  }

  next(err);
};

module.exports = {
  requestLogger,
  errorLogger
};
