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

router.post("/place", protect, placeOrder);

// GET /api/order/all - all orders
// GET /api/order/all?status=pending - pending only
// GET /api/order/all?status=confirmed - confirmed only
// GET /api/order/all?paymentMethod=esewa - esewa orders
// GET /api/order/all?page=2&limit=10 - paginated
router.get("/get-my-orders", protect, getMyOrders);

router.get("/all", protect, restrictTo("admin"), getAllOrders);
router.patch(
  "/verify-payment/:id",
  protect,
  restrictTo("admin"),
  verifyPayment,
);

router.patch("/update/:id", protect, restrictTo("admin"), updateOrder);
export default router;
