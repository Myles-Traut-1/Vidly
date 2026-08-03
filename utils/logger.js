const winston = require("winston");
require("winston-mongodb");

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.json() // Formats log entries as clean, structured JSON
  ),
  transports: [
    // 1. Console Transport (Optional but highly recommended for local dev)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple() // Cleaner to read in your terminal
      )
    }),

    // 2. File Transport - Added via the 'new' keyword
    new winston.transports.File({ 
      filename: 'logs/logfile.log',
      level: 'error' 
    }),

    // 3. MongoDB Transport - Added via the 'new' keyword
    new winston.transports.MongoDB({
      level: 'error', // Good practice: Only send errors to the DB to save space
      db: 'mongodb://127.0.0.1:27017/Vidly?directConnection=true',
      collection: 'logs', // Name of the collection in Vidly DB
      tryReconnect: true
    })
  ], 
  // FIX: Winston handles the process listeners and auto-exits cleanly for you!
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
    new winston.transports.Console({ colorise: true, prettyPrint: true })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

module.exports = logger;