import express from "express";
import { protect } from "../Middlewares/VerifyUser.js";
import { getAllUsers, updateProfile } from "../Controllers/UserController.js";
import { restrictTo } from "../Middlewares/RestictAccess.js";

const router = express.Router();

/**
 * @swagger
 * /user/update-profile:
 *   patch:
 *     tags: [User]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *               middlename:
 *                 type: string
 *               lastname:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: OK
 */
router.patch("/user/update-profile", protect, updateProfile);

/**
 * @swagger
 * /user:
 *   get:
 *     tags: [User]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/user/", protect, restrictTo("admin"), getAllUsers);

export default router;
