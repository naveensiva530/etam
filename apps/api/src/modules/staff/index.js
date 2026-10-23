const routes = require('./staff.routes');
const controller = require('./staff.controller');
const service = require('./staff.service');
const repository = require('./staff.repository');
const validation = require('./staff.validation');

module.exports = {
  routes,
  controller,
  service,
  repository,
  validation,
};
