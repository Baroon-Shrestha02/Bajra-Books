import AppError from "../Middlewares/AppError.js";
import AsyncErrorHandler from "../Middlewares/AsyncErrorHandler.js";
import Books from "../Models/BooksModel.js";
import Cart from "../Models/CartModel.js";

export const addToCart = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id ?? req.user.id;
  const { id: bookId } = req.params;
  const quantity = Number(req.body.quantity) || 1;

  if (isNaN(quantity) || quantity < 1) {
    return next(new AppError("Quantity must be a number greater than 0.", 400));
  }

  // ─── Validate Book ────────────────────────────────────────────────────────

  const book = await Books.findById(bookId);
  if (!book) return next(new AppError("Book not found.", 404));
  if (book.stock < 1) return next(new AppError("Book is out of stock.", 400));
  if (quantity > book.stock) {
    return next(
      new AppError(`Only ${book.stock} item(s) available in stock.`, 400),
    );
  }

  // ─── Find or Create Cart ──────────────────────────────────────────────────

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({ userId, books: [{ bookId, quantity }] });

    return res.status(201).json({
      success: true,
      message: "Cart created and book added.",
      cart,
    });
  }

  // ─── Check if Book Already in Cart ───────────────────────────────────────

  const existingItem = cart.books.find(
    (item) => item.bookId.toString() === bookId,
  );

  if (existingItem) {
    const newQuantity = Number(existingItem.quantity) + quantity;

    if (newQuantity > book.stock) {
      return next(
        new AppError(
          `Cannot add more. Only ${book.stock} item(s) in stock.`,
          400,
        ),
      );
    }

    existingItem.quantity = newQuantity;
  } else {
    cart.books.push({ bookId, quantity });
  }

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Book added to cart.",
    cart,
  });
});

export const getCart = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id ?? req.user.id;

  const cart = await Cart.findOne({ userId }).populate(
    "books.bookId",
    "title author original_price price discount cover_Img stock offer genre category",
  );

  if (!cart || cart.books.length === 0) {
    return res.status(200).json({
      success: true,
      message: "Your cart is empty.",
      data: [],
      totalPrice: 0,
    });
  }

  // ─── Shape Response ───────────────────────────────────────────────────────

  const items = cart.books.map((item) => {
    const book = item.bookId;

    // use offerPrice if book is on offer, otherwise regular price
    const effectivePrice = book.offer?.isOnOffer
      ? book.offer.offerPrice
      : book.price;

    return {
      cartItemId: item._id,
      quantity: item.quantity,
      effectivePrice,
      subtotal: parseFloat((effectivePrice * item.quantity).toFixed(2)),
      ...book.toObject(),
    };
  });

  const totalPrice = parseFloat(
    items.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2),
  );

  res.status(200).json({
    success: true,
    count: items.length,
    totalPrice,
    data: items,
  });
});

export const updateCartQuantity = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id ?? req.user.id;
  const { id: bookId } = req.params;
  const quantity = Number(req.body.quantity);

  if (isNaN(quantity) || quantity < 1) {
    return next(new AppError("Quantity must be a number greater than 0.", 400));
  }

  const book = await Books.findById(bookId);
  if (!book) return next(new AppError("Book not found.", 404));

  const cart = await Cart.findOne({ userId });
  if (!cart) return next(new AppError("Cart not found.", 404));

  const item = cart.books.find((item) => item.bookId.toString() === bookId);
  if (!item) return next(new AppError("Book not in cart.", 404));

  if (quantity > book.stock) {
    return next(
      new AppError(`Only ${book.stock} item(s) available in stock.`, 400),
    );
  }

  item.quantity = quantity;
  await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart updated.",
    cart,
  });
});

export const removeFromCart = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id ?? req.user.id;
  const { id: bookId } = req.params;

  const cart = await Cart.findOne({ userId });
  if (!cart) return next(new AppError("Cart not found.", 404));

  const item = cart.books.find((item) => item.bookId.toString() === bookId);
  if (!item) return next(new AppError("Book not in cart.", 404));

  cart.books = cart.books.filter((item) => item.bookId.toString() !== bookId);
  await cart.save();

  res.status(200).json({
    success: true,
    message: "Book removed from cart.",
    cart,
  });
});

export const clearCart = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id ?? req.user.id;

  const cart = await Cart.findOne({ userId });
  if (!cart || cart.books.length === 0) {
    return next(new AppError("Cart is already empty.", 400));
  }

  cart.books = [];
  await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart cleared.",
  });
});
