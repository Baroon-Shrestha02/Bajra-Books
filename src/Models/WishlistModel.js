import mongoose from "mongoose";

const wishSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Books",
      required: true,
    },
  },
  { timestamps: true },
);

// wishSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Wishlist = mongoose.model("Wishlist", wishSchema);

export default Wishlist;
