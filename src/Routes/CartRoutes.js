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

router.post("/cart/add/:id", protect, restrictTo("user"), addToCart);
router.get("/cart", protect, getCart);
router.patch("/cart/update/:id", protect, updateCartQuantity);
router.delete("/cart/remove/:id", protect, removeFromCart);
router.delete("/cart/clear", protect, clearCart);

export default router;
