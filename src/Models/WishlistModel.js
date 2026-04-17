import mongoose from "mongoose";

const wishSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    BookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Books",
      required: true,
    },
  },
  { timestamps: true },
); // Optional: Add timestamps for creation/updated tracking

// Prevent a user from favoriting the same product multiple times
wishSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Wishlist = mongoose.model("Wishlist", wishSchema);

export default Wishlist;
