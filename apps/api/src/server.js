const app = require('./app');
const config = require('./config/env');
const migrate = require('./database/migrate');
const logger = require('./config/logger');

if (!config.jwtSecret || (process.env.NODE_ENV === 'production' && config.jwtSecret.length < 32)) {
  throw new Error('Set JWT_SECRET to at least 32 random characters before starting the API in production.');
}

migrate()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  })
  .catch((error) => {
    logger.error('Database migration failed:', error);
    process.exitCode = 1;
  });
