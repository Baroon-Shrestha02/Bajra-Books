import express from "express";
import { protect } from "../Middlewares/VerifyUser.js";
import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
} from "../Controllers/CartController.js";
import { restrictTo } from "../Middlewares/RestictAccess.js";

const router = express.Router();

/**
 * @swagger
 * /cart/add/{id}:
 *   post:
 *     tags: [Cart]
 *     summary: Add book to cart
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
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/cart/add/:id", protect, restrictTo("user"), addToCart);

/**
 * @swagger
 * /cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/cart", protect, getCart);

/**
 * @swagger
 * /cart/update/{id}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update cart quantity
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
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: OK
 */
router.patch("/cart/update/:id", protect, updateCartQuantity);

/**
 * @swagger
 * /cart/remove/{id}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove book from cart
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
router.delete("/cart/remove/:id", protect, removeFromCart);

/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.delete("/cart/clear", protect, clearCart);

export default router;
