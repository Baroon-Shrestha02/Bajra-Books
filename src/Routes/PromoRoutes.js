import express from "express";
import { protect } from "../Middlewares/VerifyUser.js";
import { restrictTo } from "../Middlewares/RestictAccess.js";
import {
  createPromo,
  deletePromo,
  getAllPromos,
  updatePromo,
} from "../Controllers/PromoController.js";

const router = express.Router();

/**
 * @swagger
 * /promo/create:
 *   post:
 *     tags: [Promo]
 *     summary: Create promo code (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               couponCode:
 *                 type: string
 *               discount:
 *                 type: number
 *               maxUses:
 *                 type: number
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/promo/create", protect, restrictTo("admin"), createPromo);

/**
 * @swagger
 * /promo/all:
 *   get:
 *     tags: [Promo]
 *     summary: Get all promo codes (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/promo/all", protect, restrictTo("admin"), getAllPromos);

/**
 * @swagger
 * /promo/{id}:
 *   patch:
 *     tags: [Promo]
 *     summary: Update promo code (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               discount:
 *                 type: number
 *               maxUses:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: OK
 */
router.patch("/promo/:id", protect, restrictTo("admin"), updatePromo);

/**
 * @swagger
 * /promo/{id}:
 *   delete:
 *     tags: [Promo]
 *     summary: Delete promo code (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.delete("/promo/:id", protect, restrictTo("admin"), deletePromo);

export default router;