import jwt from "jsonwebtoken";
import AppError from "./AppError.js";
import AsyncErrorHandler from "./AsyncErrorHandler.js";
import User from "../Models/UserModel.js";

export const protect = AsyncErrorHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Not authenticated. Please log in.", 401));
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(new AppError("Token missing.", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Session expired, please log in again."
        : "Invalid token.";
    return next(new AppError(message, 401));
  }

  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    return next(new AppError("User no longer exists.", 401));
  }

  // Invalidate token if password changed after it was issued
  if (user.passwordChangedAt) {
    const changedAt = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
    if (decoded.iat < changedAt) {
      return next(
        new AppError("Password recently changed. Please log in again.", 401),
      );
    }
  }

  req.user = user;
  next();
});
