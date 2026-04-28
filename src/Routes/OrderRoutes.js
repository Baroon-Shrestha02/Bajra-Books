import express from "express";
import { protect } from "../Middlewares/VerifyUser.js";
import {
  getAllOrders,
  getMyOrders,
  placeOrder,
  updateOrder,
  validateCoupon,
  verifyPayment,
} from "../Controllers/OrderController.js";
import { restrictTo } from "../Middlewares/RestictAccess.js";

const router = express.Router();

/**
 * @swagger
 * /order/place:
 *   post:
 *     tags: [Orders]
 *     summary: Place an order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               district:
 *                 type: string
 *               city:
 *                 type: string
 *               tole:
 *                 type: string
 *               landmark:
 *                 type: string
 *               houseNo:
 *                 type: string
 *               alternativePhone:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [esewa, khalti, fonepay]
 *               couponCode:
 *                 type: string
 *               screenshot:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/order/place", protect, placeOrder);

/**
 * @swagger
 * /order/get-my-orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get my orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, dispatched, delivered, cancelled]
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/order/get-my-orders", protect, getMyOrders);

/**
 * @swagger
 * /order/all:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, dispatched, delivered, cancelled]
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [esewa, khalti, fonepay]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [unpaid, paid, rejected]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/order/all", protect, restrictTo("admin"), getAllOrders);

/**
 * @swagger
 * /order/verify-payment/{id}:
 *   patch:
 *     tags: [Orders]
 *     summary: Verify payment (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [paid, rejected]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.patch(
  "/order/verify-payment/:id",
  protect,
  restrictTo("admin"),
  verifyPayment,
);

/**
 * @swagger
 * /order/update/{id}:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [dispatched, delivered, cancelled]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.patch("/order/update/:id", protect, restrictTo("admin"), updateOrder);

/**
 * @swagger
 * /order/validate-coupon:
 *   post:
 *     tags: [Orders]
 *     summary: Validate coupon code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couponCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/order/validate-coupon", protect, validateCoupon);

export default router;
