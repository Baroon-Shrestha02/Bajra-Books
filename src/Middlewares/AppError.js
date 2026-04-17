// We extend the built-in JavaScript Error class
class AppError extends Error {
  constructor(message, statusCode) {
    // Call the parent Error constructor
    super(message);

    // HTTP status code (400, 404, 500, etc.)
    this.statusCode = statusCode;

    // Custom status label
    // If error start with 4xx → client mistake ("fail")
    // If error starts with 5xx → server issue ("error")
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";

    // This helps us distinguish expected errors
    // (like validation, not found)
    // from programming bugs
    this.isOperational = true;

    // Removes this constructor from stack trace
    // Makes debugging cleaner
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
