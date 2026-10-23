const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const config = require('./config/env');
const errorHandler = require('./middlewares/error-handler');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: config.webOrigins }));
app.use(express.json({ limit: config.jsonLimit }));

app.use('/api', routes);
app.use((req, res) => {
	res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found.' });
});
app.use(errorHandler);

module.exports = app;
