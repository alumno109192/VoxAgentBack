import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}] ${message}`;
    if (Object.keys(meta).length > 0) {
      // Filter out sensitive data
      const filtered = filterSensitiveData(meta);
      msg += ` ${JSON.stringify(filtered)}`;
    }
    return msg;
  })
);

// Filter out PII/PHI and sensitive data from logs
function filterSensitiveData(data: any): any {
  const sensitiveKeys = [
    'password',
    'hashedPassword',
    'token',
    'refreshToken',
    'apiKey',
    'secret',
    'authorization',
    'cookie',
    'ssn',
    'creditCard',
  ];

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const filtered = Array.isArray(data) ? [...data] : { ...data };

  for (const key in filtered) {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      filtered[key] = '[REDACTED]';
    } else if (typeof filtered[key] === 'object') {
      filtered[key] = filterSensitiveData(filtered[key]);
    }
  }

  return filtered;
}

// Create transports
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transports in production
if (config.env === 'production') {
  transports.push(
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    })
  );
}

const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Add request ID to logger context
export function createLoggerWithRequestId(requestId: string) {
  return logger.child({ requestId });
}

export default logger;
