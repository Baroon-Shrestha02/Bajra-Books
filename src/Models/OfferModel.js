import mongoose from "mongoose";

const OFFER_TYPES = ["stock-clearance", "festive", "custom"];

const OfferSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: OFFER_TYPES,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    books: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Books",
        required: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

const Offer = mongoose.model("Offer", OfferSchema);
export default Offer;
