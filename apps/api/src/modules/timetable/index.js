const routes = require('./timetable.routes');
const service = require('./timetable.service');
const repository = require('./timetable.repository');
const controller = require('./timetable.controller');

module.exports = {
  routes,
  service,
  repository,
  controller,
};
