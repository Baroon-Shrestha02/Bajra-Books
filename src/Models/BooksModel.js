// ─── BooksSchema ─────────────────────────────────────────────────────────────

import mongoose from "mongoose";

const GENRES = [
  "fiction",
  "romance",
  "action",
  "thriller",
  "horror",
  "fantasy",
  "biography",
  "self-help",
  "other",
];
const CATEGORIES = ["best-selling", "new-arrivals", "general"];

const BooksSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    original_price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    price: {
      type: Number, // auto-calculated: original_price - (original_price * discount / 100)
    },
    cover_Img: {
      public_id: { type: String },
      url: { type: String },
    },
    stock: {
      type: Number,
      required: true,
      default: 1,
    },
    offer: {
      isOnOffer: { type: Boolean, default: false },
      offerDiscount: { type: Number, default: 0, min: 0, max: 100 },
      offerPrice: { type: Number },
      offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
        default: null,
      },
    },
    genre: {
      type: String,
      enum: GENRES,
      required: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: "general",
      lowercase: true,
      trim: true,
    },

    weight: {
      type: Number,
      required: true,
      default: 300, // grams
    },
  },
  { timestamps: true },
);

BooksSchema.pre("save", async function () {
  // no next param — just return/await normally
  this.price = parseFloat(
    (this.original_price * (1 - this.discount / 100)).toFixed(2),
  );

  if (this.offer?.isOnOffer && this.offer?.offerDiscount > 0) {
    this.offer.offerPrice = parseFloat(
      (this.original_price * (1 - this.offer.offerDiscount / 100)).toFixed(2),
    );
  } else {
    this.offer.offerPrice = null;
  }
});

const Books = mongoose.model("Books", BooksSchema);
export default Books;
