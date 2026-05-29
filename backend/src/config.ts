import 'dotenv/config';

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/internship_platform',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
  PORT: Number(process.env.PORT) || 4000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
};