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
  role: user.role,
});

export const register = AsyncErrorHandler(async (req, res, next) => {
  const { firstname, middlename, lastname, phone, email, password, role } =
    req.body;

  if (role && role !== "user") {
    return next(new AppError("You are not authorized to set this role.", 403));
  }

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
    role: "user", // hardcoded regardless
  });

  const token = generateToken(user._id);

  res.status(201).json({
    status: "success",
    message: "Account created successfully.",
    token,
    user: userResponse(user),
  });
});

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

export const googleAuth = AsyncErrorHandler(async (req, res, next) => {
  const { email, name, photoURL } = req.body;

  // 1. Input validation
  if (!email || !name) {
    return next(new AppError("Email and name are required.", 400));
  }

  let user = await User.findOne({ email });

  if (user) {
    // 2. Update googlePhotoUrl if missing using findByIdAndUpdate
    if (!user.googlePhotoUrl) {
      user = await User.findByIdAndUpdate(
        user._id,
        { $set: { googlePhotoUrl: photoURL || user.profileImage } },
        { new: true },
      ).select("-password");
    }

    const token = generateToken(user._id);
    return res.status(200).json({ token, user: userResponse(user) });
  } else {
    // 3. Username collision retry loop
    let username;
    let attempts = 0;
    const base = name.toLowerCase().trim().split(" ").join("");

    while (attempts < 5) {
      const candidate = base + Randomstring.generate(5);
      const exists = await User.findOne({ username: candidate });
      if (!exists) {
        username = candidate;
        break;
      }
      attempts++;
    }

    if (!username) {
      return next(new AppError("Could not generate a unique username.", 500));
    }

    const hashedPass = await bcrypt.hash(Randomstring.generate(10), 12);

    const newUser = await User.create({
      username,
      email,
      password: hashedPass,
      profileImage: photoURL || defaultImg,
      googlePhotoUrl: photoURL || defaultImg, // 4. was missing
      isGoogleUser: true, // 5. flag for protect middleware
    });

    const token = generateToken(newUser._id);
    return res.status(201).json({ token, user: userResponse(newUser) });
  }
});
