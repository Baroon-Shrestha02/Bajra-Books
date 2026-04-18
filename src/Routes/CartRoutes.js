import express from "express";
import { protect } from "../Middlewares/VerifyUser.js";
import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
} from "../Controllers/CartController.js";

const router = express.Router();

router.post("/add/:id", protect, addToCart);
router.get("/", protect, getCart);
router.patch("/update/:id", protect, updateCartQuantity);
router.delete("/remove/:id", protect, removeFromCart);
router.delete("/clear", protect, clearCart);

export default router;
