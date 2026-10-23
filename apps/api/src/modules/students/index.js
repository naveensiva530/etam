const routes = require('./students.routes');
const controller = require('./students.controller');
const service = require('./students.service');
const repository = require('./students.repository');
const validation = require('./students.validation');

module.exports = {
  routes,
  controller,
  service,
  repository,
  validation,
};
