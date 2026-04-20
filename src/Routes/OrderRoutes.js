import express from "express";
import { protect } from "../Middlewares/VerifyUser.js";
import {
  getAllOrders,
  getMyOrders,
  placeOrder,
  updateOrder,
  verifyPayment,
} from "../Controllers/OrderController.js";
import { restrictTo } from "../Middlewares/RestictAccess.js";

const router = express.Router();

router.post("/order/place", protect, placeOrder);

router.get("/order/get-my-orders", protect, getMyOrders);

// GET /api/order/all - all orders
// GET /api/order/all?status=pending - pending only
// GET /api/order/all?status=confirmed - confirmed only
// GET /api/order/all?paymentMethod=esewa - esewa orders
// GET /api/order/all?page=2&limit=10 - paginated

router.get("/order/all", protect, restrictTo("admin"), getAllOrders);
router.patch(
  "/order/verify-payment/:id",
  protect,
  restrictTo("admin"),
  verifyPayment,
);

router.patch("/order/update/:id", protect, restrictTo("admin"), updateOrder);
export default router;
