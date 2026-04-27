import AppError from "../Middlewares/AppError.js";
import AsyncErrorHandler from "../Middlewares/AsyncErrorHandler.js";
import Books from "../Models/BooksModel.js";
import Cart from "../Models/CartModel.js";
import Order from "../Models/OrderModel.js";
import Promo from "../Models/PromoModel.js";
import User from "../Models/UserModel.js";
import { calculateDeliveryCharge } from "../Utils/DeliveryCharge.js";
import { uploadImages } from "../Utils/ImageUploader.js";

// ─── OrderController.js — placeOrder only ────────────────────────────────────

export const placeOrder = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id ?? req.user.id;

  const {
    alternativePhone,
    district,
    city,
    tole,
    landmark,
    houseNo,
    paymentMethod,
    couponCode,     // ← fixed: was "promo" causing variable conflict
  } = req.body;

  // ─── Validate ─────────────────────────────────────────────────────────────

  if (!district || !city || !tole) {
    return next(new AppError("district, city and tole are required.", 400));
  }

  if (!paymentMethod || !["esewa", "khalti", "fonepay"].includes(paymentMethod)) {
    return next(new AppError("Payment method must be 'esewa', 'khalti' or 'fonepay'.", 400));
  }

  if (!req.files?.screenshot) {
    return next(new AppError("Payment screenshot is required.", 400));
  }

  // ─── Fetch User & Cart ────────────────────────────────────────────────────

  const user = await User.findById(userId);
  if (!user) return next(new AppError("User not found.", 404));

  const cart = await Cart.findOne({ userId }).populate("books.bookId");
  if (!cart || cart.books.length === 0) {
    return next(new AppError("Your cart is empty.", 400));
  }

  // ─── Validate Stock ───────────────────────────────────────────────────────

  for (const item of cart.books) {
    const book = item.bookId;
    if (!book) return next(new AppError("One or more books in cart no longer exist.", 400));
    if (item.quantity > book.stock) {
      return next(
        new AppError(`"${book.title}" only has ${book.stock} item(s) left. Please update your cart.`, 400)
      );
    }
  }

  // ─── Build Books Snapshot ─────────────────────────────────────────────────

  const books = cart.books.map((item) => {
    const book = item.bookId;
    const effectivePrice = book.offer?.isOnOffer ? book.offer.offerPrice : book.price;
    return {
      bookId: book._id,
      title: book.title,
      author: book.author,
      price: effectivePrice,
      quantity: item.quantity,
      subtotal: parseFloat((effectivePrice * item.quantity).toFixed(2)),
      weight: book.weight,
    };
  });

  // ─── Calculate Weight & Delivery ─────────────────────────────────────────

  const totalWeight = books.reduce((acc, item) => acc + item.weight * item.quantity, 0);
  const { zone, deliveryCharge } = calculateDeliveryCharge(district, totalWeight);
  const totalPrice = parseFloat(books.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2));

  let grandTotal = parseFloat((totalPrice + deliveryCharge).toFixed(2));

  // ─── Apply Promo Code ─────────────────────────────────────────────────────

  let promoDetails = { code: null, discount: 0, savings: 0 };

  if (couponCode) {
    const promoDoc = await Promo.findOne({ couponCode: couponCode.toUpperCase() });

    if (!promoDoc) return next(new AppError("Invalid promo code.", 400));
    if (!promoDoc.isActive) return next(new AppError("Promo code is no longer active.", 400));
    if (promoDoc.maxUses !== null && promoDoc.usedCount >= promoDoc.maxUses) {
      return next(new AppError("Promo code has reached its maximum uses.", 400));
    }

    const savings = parseFloat((grandTotal * promoDoc.discount / 100).toFixed(2));
    grandTotal = parseFloat((grandTotal - savings).toFixed(2));

    promoDetails = {
      code: promoDoc.couponCode,
      discount: promoDoc.discount,
      savings,
    };

    promoDoc.usedCount += 1;
    await promoDoc.save();
  }

  // ─── Upload Screenshot ────────────────────────────────────────────────────

  const uploaded = await uploadImages(req.files.screenshot);
  if (!uploaded?.url) return next(new AppError("Screenshot upload failed.", 500));

  // ─── Create Order ─────────────────────────────────────────────────────────

  const order = await Order.create({
    userId,
    personalDetails: {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      alternativePhone: alternativePhone || null,
    },
    deliveryAddress: {
      district,
      city,
      tole,
      landmark: landmark || null,
      houseNo: houseNo || null,
    },
    books,
    totalPrice,
    delivery: {
      zone,
      weightInGrams: totalWeight,
      charge: deliveryCharge,
    },
    promo: promoDetails,
    grandTotal,
    payment: {
      method: paymentMethod,
      status: "unpaid",
      screenshot: {
        public_id: uploaded.public_id,
        url: uploaded.url,
      },
    },
    status: "pending",
  });

  cart.books = [];
  await cart.save();

  res.status(201).json({
    success: true,
    message: "Order placed successfully.",
    order,
  });
});

export const getMyOrders = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id ?? req.user.id;

  const orders = await Order.find({ userId }).sort({ createdAt: -1 });

  if (!orders.length) {
    return res.status(200).json({
      success: true,
      message: "No orders found.",
      data: [],
    });
  }

  res.status(200).json({
    success: true,
    total: orders.length,
    data: orders,
  });
});

export const getAllOrders = AsyncErrorHandler(async (req, res, next) => {
  const { page = 1, limit = 20, status, paymentMethod } = req.query;

  const query = {};
  if (status) query.status = status;
  if (paymentMethod) query["payment.method"] = paymentMethod;

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Order.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: orders,
  });
});

export const verifyPayment = AsyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  const VALID_PAYMENT_STATUSES = ["paid", "rejected"];

  // ─── Validate ─────────────────────────────────────────────────────────────

  if (!paymentStatus || !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
    return next(
      new AppError("Payment status must be 'paid' or 'rejected'.", 400),
    );
  }

  // ─── Find Order ───────────────────────────────────────────────────────────

  const order = await Order.findById(id);
  if (!order) return next(new AppError("Order not found.", 404));

  // ─── Block if already verified ────────────────────────────────────────────

  if (order.payment.status === "paid") {
    return next(new AppError("Payment already verified.", 400));
  }

  if (order.payment.status === "rejected") {
    return next(new AppError("Payment already rejected.", 400));
  }

  if (order.status === "cancelled") {
    return next(
      new AppError("Cannot verify payment on a cancelled order.", 400),
    );
  }

  if (paymentStatus === "paid") {
    for (const item of order.books) {
      const book = await Books.findById(item.bookId);

      if (!book) {
        return next(
          new AppError(`Book "${item.title}" no longer exists.`, 404),
        );
      }

      if (item.quantity > book.stock) {
        return next(
          new AppError(
            `"${item.title}" only has ${book.stock} item(s) left in stock.`,
            400,
          ),
        );
      }

      book.stock -= item.quantity;
      await book.save();
    }

    order.status = "confirmed";
  }

  // ─── Update Payment Status ────────────────────────────────────────────────

  order.payment.status = paymentStatus;
  if (req.body.note) order.note = req.body.note;
  await order.save();

  res.status(200).json({
    success: true,
    message: `Payment ${paymentStatus === "paid" ? "verified and order confirmed" : "rejected"} successfully.`,
    order,
  });
});

export const updateOrder = AsyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const VALID_STATUSES = ["dispatched", "delivered", "cancelled"];

  if (!status || !VALID_STATUSES.includes(status)) {
    return next(
      new AppError(`Status must be one of: ${VALID_STATUSES.join(", ")}`, 400),
    );
  }

  const order = await Order.findById(id);
  if (!order) return next(new AppError("Order not found.", 404));

  if (order.status === "cancelled") {
    return next(new AppError("Cannot update a cancelled order.", 400));
  }

  if (order.status === "delivered") {
    return next(new AppError("Cannot update a delivered order.", 400));
  }

  if (status === "dispatched" && order.status !== "confirmed") {
    return next(new AppError("Order must be confirmed before shipping.", 400));
  }

  if (status === "delivered" && order.status !== "dispatched") {
    return next(new AppError("Order must be dispatched before delivery.", 400));
  }

  if (status === "cancelled" && order.status === "confirmed") {
    for (const item of order.books) {
      const book = await Books.findById(item.bookId);
      if (book) {
        book.stock += item.quantity;
        await book.save();
      }
    }
  }

  order.status = status;
  if (note) order.note = note;
  await order.save();

  res.status(200).json({
    success: true,
    message: `Order ${status} successfully.`,
    order,
  });
});
