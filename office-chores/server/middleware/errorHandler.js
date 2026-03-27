function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.message && err.message.includes('FOREIGN KEY')) {
    return res.status(409).json({ error: 'Operation violates a data constraint' });
  }
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
