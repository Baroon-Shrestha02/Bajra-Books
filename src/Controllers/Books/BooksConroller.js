import AppError from "../../Middlewares/AppError.js";
import AsyncErrorHandler from "../../Middlewares/AsyncErrorHandler.js";
import Books from "../../Models/BooksModel.js";
import Wishlist from "../../Models/WishlistModel.js";
import {
  deleteImages,
  replaceImage,
  uploadImages,
} from "../../Utils/ImageUploader.js";

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

export const addBooks = AsyncErrorHandler(async (req, res, next) => {
  const {
    author,
    isbn,
    title,
    description,
    original_price,
    discount = 0,
    stock,
    genre,
    category = "general",
    weight = 300,
  } = req.body;

  const missing = [author, isbn, title, description, genre].some((f) => !f);
  const missingNums = [original_price, stock, weight].some(
    (f) => f === undefined || f === null || isNaN(Number(f)),
  );

  if (missing || missingNums) {
    return next(new AppError("All fields are required", 400));
  }

  if (Number(discount) < 0 || Number(discount) > 100) {
    return next(new AppError("Discount must be between 0 and 100", 400));
  }

  if (!req.files?.cover_Img) {
    return next(new AppError("Cover image is required", 400));
  }

  const cover_Img = await uploadImages(req.files.cover_Img);
  if (!cover_Img?.url) {
    return next(new AppError("Image upload failed", 500));
  }

  const book = await Books.create({
    author,
    isbn,
    title,
    description,
    original_price: Number(original_price),
    discount: Number(discount),
    stock: Number(stock),
    genre: genre.toLowerCase(),
    category: category.toLowerCase(),
    cover_Img: {
      public_id: cover_Img.public_id,
      url: cover_Img.url,
    },
    weight,
  });

  res.status(201).json({
    success: true,
    message: "Book added successfully",
    book,
  });
});

export const getBooks = AsyncErrorHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    author,
    sort = "createdAt",
    genre,
    category,
    offer, // ?offer=true → only books on offer
    minPrice, // ?minPrice=100
    maxPrice, // ?maxPrice=500
  } = req.query;

  const query = {};

  // text search
  if (search) query.title = { $regex: search, $options: "i" };
  if (author) query.author = { $regex: author, $options: "i" };

  // exact match filters
  if (genre) query.genre = genre.toLowerCase();
  if (category) query.category = category.toLowerCase();
  if (offer === "true") query["offer.isOnOffer"] = true;

  // price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [books, total] = await Promise.all([
    Books.find(query)
      .sort({ [sort]: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Books.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    limit: Number(limit),
    books,
  });
});

export const deleteBook = AsyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const book = await Books.findById(id);
  if (!book) return next(new AppError("Book not found", 404));

  if (book.cover_Img?.public_id) {
    await deleteImages(book.cover_Img.public_id);
  }

  await Books.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Book deleted successfully",
  });
});

export const updateBook = AsyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  // ─── Find Book ────────────────────────────────────────────────────────────

  const book = await Books.findById(id);
  if (!book) return next(new AppError("Book not found", 404));

  // ─── Destructure Fields ───────────────────────────────────────────────────

  const {
    author,
    isbn,
    title,
    description,
    original_price,
    discount,
    stock,
    genre,
    category,
    weight,
  } = req.body;

  // ─── Validate Genre & Category if provided ────────────────────────────────

  if (genre && !GENRES.includes(genre.toLowerCase())) {
    return next(
      new AppError(`Invalid genre. Allowed: ${GENRES.join(", ")}`, 400),
    );
  }

  if (category && !CATEGORIES.includes(category.toLowerCase())) {
    return next(
      new AppError(`Invalid category. Allowed: ${CATEGORIES.join(", ")}`, 400),
    );
  }

  if (
    discount !== undefined &&
    (Number(discount) < 0 || Number(discount) > 100)
  ) {
    return next(new AppError("Discount must be between 0 and 100", 400));
  }

  // ─── Update Image if provided ─────────────────────────────────────────────

  if (req.files?.cover_Img) {
    const cover_Img = book.cover_Img?.public_id
      ? await replaceImage(book.cover_Img.public_id, req.files.cover_Img)
      : await uploadImages(req.files.cover_Img);

    if (!cover_Img?.url) {
      return next(new AppError("Image upload failed", 500));
    }

    book.cover_Img = {
      public_id: cover_Img.public_id,
      url: cover_Img.url,
    };
  }

  // ─── Update Fields if provided ────────────────────────────────────────────

  if (author) book.author = author;
  if (isbn) book.isbn = isbn;
  if (title) book.title = title;
  if (description) book.description = description;
  if (original_price !== undefined)
    book.original_price = Number(original_price);
  if (discount !== undefined) book.discount = Number(discount);
  if (stock !== undefined) book.stock = Number(stock);
  if (genre) book.genre = genre.toLowerCase();
  if (category) book.category = category.toLowerCase();
  if (weight) book.weight = weight;

  // ─── Save (pre save hook recalculates price & offerPrice) ─────────────────

  await book.save();

  res.status(200).json({
    success: true,
    message: "Book updated successfully",
    book,
  });
});

export const wishList = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id ?? req.user.id;
  const { id: bookId } = req.params;

  if (!bookId) return next(new AppError("Product ID is required.", 400));
  // Verify product exists before touching the wishlist
  const productExists = await Books.exists({ _id: bookId });

  if (!productExists) return next(new AppError("Product not found.", 404));

  const existingFavourite = await Wishlist.findOne({ userId, bookId });

  if (existingFavourite) {
    await existingFavourite.deleteOne(); // avoids second DB round-trip
    return res.status(200).json({
      success: true,
      message: "Product removed from favorites.",
    });
  }

  await Wishlist.create({ userId, bookId });

  return res.status(201).json({
    success: true,
    message: "Product added to favorites.",
  });
});

export const getWishlist = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id ?? req.user.id;

  const wishlist = await Wishlist.find({ userId })
    .populate(
      "bookId",
      "title author original_price price discount cover_Img stock offer genre category",
    )
    .lean();

  if (!wishlist.length) {
    return res.status(200).json({
      success: true,
      message: "Your wishlist is empty.",
      data: [],
    });
  }

  // Clean up response shape
  const products = wishlist.map((item) => ({
    wishlistItemId: item._id,
    ...item.bookId,
  }));

  return res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});
