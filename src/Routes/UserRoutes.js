import express from "express";
import { protect } from "../Middlewares/VerifyUser.js";
import { updateProfile } from "../Controllers/UserController.js";

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

export default router;
