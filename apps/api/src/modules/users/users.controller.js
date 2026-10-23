const usersService = require('./users.service');

exports.getUsers = async (req, res, next) => {
  try {
    const user = await usersService.getUser(req.auth.userId);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};
