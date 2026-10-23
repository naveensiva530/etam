const pool = require('../../config/db');

exports.findByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

exports.create = async ({ email, passwordHash, role = 'admin' }) => {
  const [result] = await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, passwordHash, role]);
  return { id: result.insertId, email, role };
};
