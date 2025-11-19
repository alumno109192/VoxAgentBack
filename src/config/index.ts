import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  env: string;
  port: number;
  appName: string;
  appVersion: string;
  mongo: {
    uri: string;
    user?: string;
    password?: string;
  };
  redis: {
    url: string;
    password?: string;
  };
  jwt: {
    secret: string;
    accessExpires: string;
    refreshExpires: string;
  };
  bland: {
    apiKey: string;
    apiSecret: string;
    webhookSecret: string;
    tokenCacheTTL: number;
    baseUrl: string;
  };
  vapi: {
    apiUrl: string;
    publicKey: string;
    assistantId: string;
    apiKey?: string; // Private key para server-side
  };
  sendgrid: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
    publishableKey: string;
  };
  aws: {
    s3Bucket: string;
    s3Region: string;
    accessKeyId: string;
    secretAccessKey: string;
    presignedUrlExpires: number;
  };
  openai?: {
    apiKey: string;
  };
  sentry?: {
    dsn: string;
  };
  logLevel: string;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origin: string[];
  };
  encryption: {
    key: string;
    algorithm: string;
  };
  features: {
    enableRealtime: boolean;
    enableStripe: boolean;
    enableSendgrid: boolean;
    enableWhisperFallback: boolean;
    allowPaymentEmulation: boolean;
  };
  emulator: {
    key: string;
    paymentsJsonPath: string;
  };
  retention: {
    callRecordingDays: number;
    transcriptionDays: number;
    auditLogDays: number;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  appName: process.env.APP_NAME || 'voice-assistant',
  appVersion: process.env.APP_VERSION || '1.0.0',

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/voice-assistant',
    user: process.env.MONGO_USER,
    password: process.env.MONGO_PASSWORD,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  bland: {
    apiKey: process.env.BLAND_API_KEY || '',
    apiSecret: process.env.BLAND_API_SECRET || '',
    webhookSecret: process.env.BLAND_WEBHOOK_SECRET || '',
    tokenCacheTTL: parseInt(process.env.BLAND_TOKEN_CACHE_TTL || '300', 10),
    baseUrl: process.env.BLAND_API_BASE_URL || 'https://api.bland.ai/v1',
  },

  vapi: {
    apiUrl: process.env.VAPI_API_URL || 'https://api.vapi.ai',
    publicKey: process.env.VAPI_PUBLIC_KEY || '209ac772-6752-4407-9740-84afdfc7a41c',
    assistantId: process.env.VAPI_ASSISTANT_ID || '0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf',
    apiKey: process.env.VAPI_API_KEY, // Optional private key
  },

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || '',
    fromName: process.env.SENDGRID_FROM_NAME || 'Voice Assistant',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },

  aws: {
    s3Bucket: process.env.S3_BUCKET || '',
    s3Region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    presignedUrlExpires: parseInt(process.env.S3_PRESIGNED_URL_EXPIRES || '3600', 10),
  },

  openai: process.env.OPENAI_API_KEY
    ? {
        apiKey: process.env.OPENAI_API_KEY,
      }
    : undefined,

  sentry: process.env.SENTRY_DSN
    ? {
        dsn: process.env.SENTRY_DSN,
      }
    : undefined,

  logLevel: process.env.LOG_LEVEL || 'info',

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000'],
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || 'change-this-32-character-key-now',
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
  },

  features: {
    enableRealtime: process.env.ENABLE_REALTIME === 'true',
    enableStripe: process.env.ENABLE_STRIPE === 'true',
    enableSendgrid: process.env.ENABLE_SENDGRID === 'true',
    enableWhisperFallback: process.env.ENABLE_WHISPER_FALLBACK === 'true',
    allowPaymentEmulation: process.env.ALLOW_PAYMENT_EMULATION === 'true',
  },

  emulator: {
    key: process.env.EMULATOR_KEY || 'dev-emulator-key-change-in-prod',
    paymentsJsonPath: process.env.PAYMENTS_JSON_PATH || './data/payments',
  },

  retention: {
    callRecordingDays: parseInt(process.env.CALL_RECORDING_RETENTION_DAYS || '90', 10),
    transcriptionDays: parseInt(process.env.TRANSCRIPTION_RETENTION_DAYS || '365', 10),
    auditLogDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '730', 10),
  },
};

export default config;
