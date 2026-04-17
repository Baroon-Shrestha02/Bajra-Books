import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/UserModel.js";
import AsyncErrorHandler from "../Middlewares/AsyncErrorHandler.js";
import AppError from "../Middlewares/AppError.js";

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const userResponse = (user) => ({
  id: user._id,
  firstname: user.firstname,
  middlename: user.middlename,
  lastname: user.lastname,
  email: user.email,
  phone: user.phone,
  profileImage: user.profileImage,
});

// POST /api/auth/register
export const register = AsyncErrorHandler(async (req, res, next) => {
  const { firstname, middlename, lastname, phone, email, password } = req.body;

  if (!firstname || !lastname || !phone || !email || !password) {
    return next(new AppError("Please fill all required fields.", 400));
  }

  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    const field = existingUser.email === email ? "Email" : "Phone number";
    return next(new AppError(`${field} already registered.`, 409));
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    firstname,
    middlename,
    lastname,
    phone,
    email,
    password: hashedPassword,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    status: "success",
    message: "Account created successfully.",
    token,
    user: userResponse(user),
  });
});

// POST /api/auth/login
export const login = AsyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required.", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Invalid credentials.", 401));
  }

  const token = generateToken(user._id);

  res.status(200).json({
    status: "success",
    message: "Login successfully.",
    token,
    user: userResponse(user),
  });
});

// POST /api/auth/logout
export const logout = AsyncErrorHandler(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    message: "Logged out successfully. Please remove the token from client.",
  });
});

// GET /api/auth/me
export const getLoggedUser = AsyncErrorHandler(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    user: userResponse(req.user),
  });
});
