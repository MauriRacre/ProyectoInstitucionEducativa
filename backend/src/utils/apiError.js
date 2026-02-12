function apiError(res, type, message, fields = null, status = 400) {
  return res.status(status).json({
    error: type,
    message,
    fields
  });
}

module.exports = { apiError };
