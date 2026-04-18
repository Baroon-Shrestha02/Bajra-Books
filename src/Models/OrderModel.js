import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    personalDetails: {
      firstname: { type: String, required: true, trim: true },
      lastname: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      alternativePhone: { type: String, trim: true, default: null },
    },

    deliveryAddress: {
      zone: {
        type: String,
        enum: ["kathmandu", "outside_valley", "remote"],
        required: true,
      },
      district: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      street: { type: String, trim: true },
    },

    books: [
      {
        bookId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Books",
        },
        title: { type: String, required: true },
        author: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        subtotal: { type: Number, required: true },
        weight: { type: Number, required: true },
      },
    ],

    totalPrice: { type: Number, required: true },

    delivery: {
      zone: { type: String },
      weightInGrams: { type: Number },
      charge: { type: Number, default: 0 },
    },

    grandTotal: { type: Number, required: true },

    payment: {
      method: {
        type: String,
        enum: ["esewa", "khalti"],
        required: true,
      },
      status: {
        type: String,
        enum: ["unpaid", "paid", "rejected"],
        default: "unpaid",
      },
      screenshot: {
        public_id: { type: String, default: null },
        url: { type: String, default: null },
      },
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "dispatched", "delivered", "cancelled"],
      default: "pending",
    },

    note: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
