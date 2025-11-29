require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const webhookRoutes = require('./src/routes/webhookRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure local data directory exists for SQLite file
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(
  // JSON-formatted request logging
  require('morgan')((tokens, req, res) =>
    JSON.stringify({
      level: 'info',
      event: 'http_request',
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number(tokens.status(req, res)),
      contentLength: tokens.res(req, res, 'content-length'),
      responseTimeMs: Number(tokens['response-time'](req, res)),
    })
  )
);

// Routes
app.use('/', messageRoutes);
app.use('/', webhookRoutes);

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error({
    event: 'unhandled_error',
    message: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info({ event: 'server_started', port: PORT });
});

