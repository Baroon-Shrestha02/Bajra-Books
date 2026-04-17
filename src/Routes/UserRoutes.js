import express from "express";

import { protect } from "../Middlewares/VerifyUser.js";
import { updateProfile } from "../Controllers/UserController.js";

const router = express.Router();

router.patch("/update-profile", protect, updateProfile);

export default router;
