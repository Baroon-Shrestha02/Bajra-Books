import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    books: [
      {
        bookId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Books",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
          min: [1, "Quantity cannot be less than 1"],
        },
      },
    ],
  },
  { timestamps: true },
);

cartSchema.index({ userId: 1 });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
