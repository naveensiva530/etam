const pool = require('../../config/db');

const mapDepartment = (row) => ({
  id: String(row.id),
  institution: row.institution,
  name: row.name
});

exports.getAll = async (userId, institution) => {
  const [rows] = await pool.execute(
    'SELECT id, institution, name FROM departments WHERE owner_user_id = ? AND institution = ? ORDER BY name, id',
    [userId, institution]
  );
  return rows.map(mapDepartment);
};

exports.create = async (userId, institution, name) => {
  const [result] = await pool.execute(
    'INSERT INTO departments (owner_user_id, institution, name) VALUES (?, ?, ?)',
    [userId, institution, name]
  );
  const [rows] = await pool.execute(
    'SELECT id, institution, name FROM departments WHERE id = ? AND owner_user_id = ?',
    [result.insertId, userId]
  );
  return mapDepartment(rows[0]);
};

exports.update = async (userId, id, name) => {
  const [result] = await pool.execute(
    'UPDATE departments SET name = ? WHERE id = ? AND owner_user_id = ?',
    [name, id, userId]
  );
  if (!result.affectedRows) return null;

  const [rows] = await pool.execute(
    'SELECT id, institution, name FROM departments WHERE id = ? AND owner_user_id = ?',
    [id, userId]
  );
  return rows[0] ? mapDepartment(rows[0]) : null;
};

exports.remove = async (userId, id) => {
  const [result] = await pool.execute(
    'DELETE FROM departments WHERE id = ? AND owner_user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
};
