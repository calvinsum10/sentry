function log(level, payload) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    ...payload,
  };
  // Simple JSON logging to stdout
  console.log(JSON.stringify(entry));
}

function info(payload) {
  log('info', payload);
}

function error(payload) {
  log('error', payload);
}

module.exports = {
  info,
  error,
};
