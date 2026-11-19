
const errorHandler = (err, req, res, next) => {
  console.error("API Error:", {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
  });

  let statusCode = err.status || err.statusCode || res.statusCode;

  if (!statusCode || statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  const message =
    statusCode === 500
      ? "Internal server error. Please try again later."
      : err.message || "Something went wrong.";

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { errorHandler };
