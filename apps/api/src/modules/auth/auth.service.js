const authRepository = require('./auth.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');

exports.login = async (credentials) => {
  const account = await authRepository.findByEmail(credentials.email);
  if (!account || !(await bcrypt.compare(credentials.password, account.password))) {
    const error = new Error('Email or password is incorrect.');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }
  return createSession(account);
};

exports.register = async (data) => {
  const passwordHash = await bcrypt.hash(data.password, 12);
  const account = await authRepository.create({ email: data.email, passwordHash, role: data.role || 'admin' });
  return createSession(account);
};

const createSession = (account) => {
  const user = {
    id: String(account.id),
    email: account.email,
    role: account.role || 'admin'
  };
  const token = jwt.sign({ email: user.email, role: user.role }, config.jwtSecret, {
    subject: user.id,
    expiresIn: config.jwtExpiresIn
  });
  return { data: { token, user } };
};
