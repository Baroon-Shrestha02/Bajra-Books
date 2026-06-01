import mongoose from "mongoose";

const CATEGORIES = ["best-selling", "new-arrivals", "general"];

const LANGUAGES = ["nepali", "english"];

const BooksSchema = new mongoose.Schema(
  {
    author: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one author is required",
      },
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
    publisher: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: String,
      enum: LANGUAGES,
      required: true,
      lowercase: true,
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Genre",
      required: true,
    },
    sub_genre: {
      type: String,
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

// Normalize author entries (trim + drop empties + dedupe within the same book)
BooksSchema.pre("validate", function () {
  if (Array.isArray(this.author)) {
    this.author = [
      ...new Set(
        this.author
          .map((a) => (typeof a === "string" ? a.trim() : ""))
          .filter(Boolean),
      ),
    ];
  }
});

BooksSchema.pre("save", async function () {
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

// Helpful index for "list all unique sub_genres under a genre" queries
BooksSchema.index({ genre: 1, sub_genre: 1 });

const Books = mongoose.model("Books", BooksSchema);
export default Books;
