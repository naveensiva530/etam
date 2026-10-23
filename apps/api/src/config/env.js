const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const webOrigins = (process.env.WEB_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = {
  port: Number(process.env.PORT || 5000),
  jsonLimit: process.env.JSON_LIMIT || '12mb',
  webOrigins,
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'development-only-secret-change-before-hosting'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  createDatabaseIfMissing: process.env.DB_CREATE_IF_MISSING === 'true',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'etam_attendance_db'
  }
};
