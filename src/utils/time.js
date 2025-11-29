function calculateAgeMinutes(timestamp) {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  return Math.floor(diffMs / 60000);
}

module.exports = { calculateAgeMinutes };
