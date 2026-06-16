const errorHandler = (err, req, res, _next) => {
  console.error('[Error]', err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
};

module.exports = errorHandler;
