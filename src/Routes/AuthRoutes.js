import express from "express";
import {
  getLoggedUser,
  login,
  logout,
  register,
} from "../Controllers/AuthController.js";
import { protect } from "../Middlewares/VerifyUser.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.get("/logged-user", protect, getLoggedUser);

export default router;
