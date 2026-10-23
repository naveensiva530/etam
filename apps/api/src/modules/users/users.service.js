const usersRepository = require('./users.repository');

exports.getUser = async (id) => {
  return usersRepository.getById(id);
};
