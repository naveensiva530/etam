const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const logger = require('../config/logger');

const migrationsPath = path.resolve(__dirname, '../../database/migrations');

async function createConnection() {
  const connectionOptions = { ...config.db, charset: 'utf8mb4', timezone: 'Z', multipleStatements: true };
  try {
    return await mysql.createConnection(connectionOptions);
  } catch (error) {
    if (error.code !== 'ER_BAD_DB_ERROR' || !config.createDatabaseIfMissing) throw error;

    const { database, ...serverOptions } = connectionOptions;
    if (!/^[A-Za-z0-9_]+$/.test(database)) {
      throw new Error('DB_NAME may contain only letters, numbers, and underscores.');
    }

    const connection = await mysql.createConnection(serverOptions);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
    await connection.changeUser({ database });
    logger.info(`Created database ${database}`);
    return connection;
  }
}

async function migrate() {
  const connection = await createConnection();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const files = (await fs.readdir(migrationsPath))
      .filter((file) => file.endsWith('.sql'))
      .sort();
    const [appliedRows] = await connection.query('SELECT name FROM schema_migrations');
    const applied = new Set(appliedRows.map((row) => row.name));

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await fs.readFile(path.join(migrationsPath, file), 'utf8');
      await connection.query(sql);
      await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
      logger.info(`Applied migration ${file}`);
    }

    const [users] = await connection.query('SELECT id, password FROM users');
    let upgradedPasswords = 0;
    for (const user of users) {
      if (/^\$2[aby]\$\d{2}\$/.test(user.password)) continue;
      const passwordHash = await bcrypt.hash(user.password, 12);
      await connection.execute('UPDATE users SET password = ? WHERE id = ?', [passwordHash, user.id]);
      upgradedPasswords += 1;
    }
    const [roleCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'role'");
    if (roleCols.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN role ENUM('superadmin', 'admin', 'staff', 'student') NOT NULL DEFAULT 'admin' AFTER password");
      logger.info('Ensured role column exists in users table');
    }

    if (upgradedPasswords > 0) {
      logger.info(`Upgraded ${upgradedPasswords} legacy account password(s) to bcrypt`);
    }
  } finally {
    await connection.end();
  }
}

module.exports = migrate;

if (require.main === module) {
  migrate().catch((error) => {
    logger.error('Database migration failed:', error);
    process.exitCode = 1;
  });
}