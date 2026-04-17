const GlobalErrorHandler = (err, req, res, next) => {
  // show complete error message for debugging
  console.error("ERROR", err);
  // If error has no statusCode, default to 500
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: err.status || "error",
    message: err.message || "Something went wrong",
  });
};

export default GlobalErrorHandler;
