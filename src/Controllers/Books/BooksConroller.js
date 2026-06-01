import AppError from "../../Middlewares/AppError.js";
import AsyncErrorHandler from "../../Middlewares/AsyncErrorHandler.js";
import Books from "../../Models/BooksModel.js";
import Genre from "../../Models/GenreModel.js";
import Wishlist from "../../Models/WishlistModel.js";
import {
  deleteImages,
  replaceImage,
  uploadImages,
} from "../../Utils/ImageUploader.js";

const CATEGORIES = ["best-selling", "new-arrivals", "general"];
const LANGUAGES = ["nepali", "english"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Authors may arrive as: array, JSON string, or comma-separated string
// (multipart/form-data does not preserve arrays cleanly).
const parseAuthors = (raw) => {
  if (raw === undefined || raw === null) return [];

  let list = raw;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[")) {
      try {
        list = JSON.parse(trimmed);
      } catch {
        list = trimmed.split(",");
      }
    } else {
      list = trimmed.split(",");
    }
  }

  if (!Array.isArray(list)) return [];

  return [
    ...new Set(
      list.map((a) => (typeof a === "string" ? a.trim() : "")).filter(Boolean),
    ),
  ];
};

// Normalize genre name and find-or-create. Case-insensitive: any casing
// resolves to the same lowercase Genre document.
const resolveGenre = async (raw) => {
  if (typeof raw !== "string") return null;
  const name = raw.trim().toLowerCase();
  if (!name) return null;

  const existing = await Genre.findOne({ name });
  if (existing) return existing;

  return Genre.create({ name });
};

// Drop a Genre doc if no books reference it. No-op on falsy id.
const pruneGenreIfEmpty = async (genreId) => {
  if (!genreId) return false;
  const remaining = await Books.countDocuments({ genre: genreId });
  if (remaining > 0) return false;
  await Genre.deleteOne({ _id: genreId });
  return true;
};

// ─── Add Book ────────────────────────────────────────────────────────────────

export const addBooks = AsyncErrorHandler(async (req, res, next) => {
  const {
    author,
    isbn,
    title,
    description,
    publisher,
    language,
    original_price,
    discount = 0,
    stock,
    genre,
    sub_genre,
    category = "general",
    weight = 300,
  } = req.body;

  const authors = parseAuthors(author);

  const missing = [
    isbn,
    title,
    description,
    publisher,
    language,
    genre,
    sub_genre,
  ].some((f) => !f);

  const missingNums = [original_price, stock, weight].some(
    (f) => f === undefined || f === null || isNaN(Number(f)),
  );

  if (missing || missingNums || authors.length === 0) {
    return next(new AppError("All fields are required", 400));
  }

  if (!CATEGORIES.includes(category.toLowerCase())) {
    return next(
      new AppError(`Invalid category. Allowed: ${CATEGORIES.join(", ")}`, 400),
    );
  }

  if (!LANGUAGES.includes(language.toLowerCase())) {
    return next(
      new AppError(`Invalid language. Allowed: ${LANGUAGES.join(", ")}`, 400),
    );
  }

  if (Number(discount) < 0 || Number(discount) > 100) {
    return next(new AppError("Discount must be between 0 and 100", 400));
  }

  if (!req.files?.cover_Img) {
    return next(new AppError("Cover image is required", 400));
  }

  const genreDoc = await resolveGenre(genre);
  if (!genreDoc) return next(new AppError("Invalid genre", 400));

  const normalizedSubGenre = sub_genre.trim().toLowerCase();

  const cover_Img = await uploadImages(req.files.cover_Img);
  if (!cover_Img?.url) {
    return next(new AppError("Image upload failed", 500));
  }

  const book = await Books.create({
    author: authors,
    isbn,
    title,
    description,
    publisher,
    language: language.toLowerCase(),
    original_price: Number(original_price),
    discount: Number(discount),
    stock: Number(stock),
    genre: genreDoc._id,
    sub_genre: normalizedSubGenre,
    category: category.toLowerCase(),
    cover_Img: {
      public_id: cover_Img.public_id,
      url: cover_Img.url,
    },
    weight,
  });

  await book.populate("genre", "name");

  res.status(201).json({
    success: true,
    message: "Book added successfully",
    book,
  });
});

// ─── Get Books ───────────────────────────────────────────────────────────────

export const getBooks = AsyncErrorHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    author,
    publisher,
    language,
    sort = "createdAt",
    genre,
    sub_genre,
    category,
    offer,
    minPrice,
    maxPrice,
  } = req.query;

  const query = {};

  if (search) query.title = { $regex: search, $options: "i" };
  if (author) query.author = { $elemMatch: { $regex: author, $options: "i" } };
  if (publisher) query.publisher = { $regex: publisher, $options: "i" };

  if (sub_genre) query.sub_genre = sub_genre.toLowerCase();
  if (category) query.category = category.toLowerCase();
  if (language) query.language = language.toLowerCase();
  if (offer === "true") query["offer.isOnOffer"] = true;

  if (genre) {
    const genreDoc = await Genre.findOne({
      name: String(genre).toLowerCase().trim(),
    })
      .select("_id")
      .lean();
    if (!genreDoc) {
      return res.status(200).json({
        success: true,
        total: 0,
        page: Number(page),
        pages: 0,
        limit: Number(limit),
        books: [],
      });
    }
    query.genre = genreDoc._id;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [books, total] = await Promise.all([
    Books.find(query)
      .populate("genre", "name")
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

// ─── Get Genres (with counts + sub-genre breakdown) ──────────────────────────

export const getGenres = AsyncErrorHandler(async (req, res, next) => {
  const aggregated = await Books.aggregate([
    {
      $group: {
        _id: { genre: "$genre", sub_genre: "$sub_genre" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.genre",
        count: { $sum: "$count" },
        subGenres: {
          $push: { name: "$_id.sub_genre", count: "$count" },
        },
      },
    },
  ]);

  const allGenres = await Genre.find().lean();
  const map = new Map(aggregated.map((g) => [String(g._id), g]));

  const genres = allGenres
    .map((g) => {
      const stats = map.get(String(g._id));
      return {
        _id: g._id,
        name: g.name,
        count: stats?.count || 0,
        subGenres: stats?.subGenres || [],
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  res.status(200).json({
    success: true,
    count: genres.length,
    genres,
  });
});

// ─── Get Sub-Genres ──────────────────────────────────────────────────────────

export const getSubGenres = AsyncErrorHandler(async (req, res, next) => {
  const { genre } = req.query;

  const match = {};
  if (genre) {
    const genreDoc = await Genre.findOne({
      name: String(genre).toLowerCase().trim(),
    })
      .select("_id")
      .lean();
    if (!genreDoc) {
      return res.status(200).json({ success: true, count: 0, subGenres: [] });
    }
    match.genre = genreDoc._id;
  }

  const subGenres = await Books.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$sub_genre",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id",
        count: 1,
      },
    },
    { $sort: { count: -1, name: 1 } },
  ]);

  res.status(200).json({
    success: true,
    count: subGenres.length,
    subGenres,
  });
});

// ─── Delete Book ─────────────────────────────────────────────────────────────

export const deleteBook = AsyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const book = await Books.findById(id);
  if (!book) return next(new AppError("Book not found", 404));

  const genreId = book.genre;

  if (book.cover_Img?.public_id) {
    await deleteImages(book.cover_Img.public_id);
  }

  await Books.findByIdAndDelete(id);

  // If that was the last book in its genre, drop the Genre doc too.
  await pruneGenreIfEmpty(genreId);

  res.status(200).json({
    success: true,
    message: "Book deleted successfully",
  });
});

// ─── Update Book ─────────────────────────────────────────────────────────────

export const updateBook = AsyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const book = await Books.findById(id);
  if (!book) return next(new AppError("Book not found", 404));

  const {
    author,
    isbn,
    title,
    description,
    publisher,
    language,
    original_price,
    discount,
    stock,
    genre,
    sub_genre,
    category,
    weight,
  } = req.body;

  if (category && !CATEGORIES.includes(category.toLowerCase())) {
    return next(
      new AppError(`Invalid category. Allowed: ${CATEGORIES.join(", ")}`, 400),
    );
  }

  if (language && !LANGUAGES.includes(language.toLowerCase())) {
    return next(
      new AppError(`Invalid language. Allowed: ${LANGUAGES.join(", ")}`, 400),
    );
  }

  if (
    discount !== undefined &&
    (Number(discount) < 0 || Number(discount) > 100)
  ) {
    return next(new AppError("Discount must be between 0 and 100", 400));
  }

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

  if (author !== undefined) {
    const authors = parseAuthors(author);
    if (authors.length === 0) {
      return next(new AppError("At least one author is required", 400));
    }
    book.author = authors;
  }

  // Track previous genre so we can prune it if this update orphans it.
  const previousGenreId = book.genre;
  let genreChanged = false;

  if (genre) {
    const genreDoc = await resolveGenre(genre);
    if (!genreDoc) return next(new AppError("Invalid genre", 400));
    if (String(genreDoc._id) !== String(previousGenreId)) {
      genreChanged = true;
    }
    book.genre = genreDoc._id;
  }

  if (isbn) book.isbn = isbn;
  if (title) book.title = title;
  if (description) book.description = description;
  if (publisher) book.publisher = publisher;
  if (language) book.language = language.toLowerCase();
  if (original_price !== undefined)
    book.original_price = Number(original_price);
  if (discount !== undefined) book.discount = Number(discount);
  if (stock !== undefined) book.stock = Number(stock);
  if (sub_genre) book.sub_genre = sub_genre.toLowerCase().trim();
  if (category) book.category = category.toLowerCase();
  if (weight) book.weight = weight;

  await book.save();
  await book.populate("genre", "name");

  // If the genre was reassigned and the previous one is now empty, drop it.
  if (genreChanged) {
    await pruneGenreIfEmpty(previousGenreId);
  }

  res.status(200).json({
    success: true,
    message: "Book updated successfully",
    book,
  });
});

// ─── Wishlist ────────────────────────────────────────────────────────────────

export const wishList = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id ?? req.user.id;
  const { id: bookId } = req.params;

  if (!bookId) return next(new AppError("Book ID is required.", 400));
  const productExists = await Books.exists({ _id: bookId });

  if (!productExists) return next(new AppError("Book not found.", 404));

  const existingFavourite = await Wishlist.findOne({ userId, bookId });

  if (existingFavourite) {
    await existingFavourite.deleteOne();
    return res.status(200).json({
      success: true,
      added: false,
      message: "Book removed from favorites.",
    });
  }

  await Wishlist.create({ userId, bookId });

  return res.status(201).json({
    success: true,
    added: true,
    message: "Book added to favorites.",
  });
});

export const getWishlist = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id ?? req.user.id;

  const wishlist = await Wishlist.find({ userId })
    .populate({
      path: "bookId",
      select:
        "title author publisher language original_price price discount cover_Img stock offer genre sub_genre category",
      populate: { path: "genre", select: "name" },
    })
    .lean();

  if (!wishlist.length) {
    return res.status(200).json({
      success: true,
      message: "Your wishlist is empty.",
      data: [],
    });
  }

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

// ─── Migrate: backfill legacy string-genre books into Genre collection ───────

export const migrateGenres = AsyncErrorHandler(async (req, res, next) => {
  // Find books where `genre` is still a string (pre-migration state)
  const legacyBooks = await Books.find({
    genre: { $type: "string" },
  }).lean();

  const summary = {
    booksScanned: legacyBooks.length,
    genresCreated: 0,
    genresReused: 0,
    booksUpdated: 0,
    skipped: [],
  };

  for (const book of legacyBooks) {
    const raw = typeof book.genre === "string" ? book.genre.trim() : "";
    if (!raw) {
      summary.skipped.push({ _id: book._id, reason: "empty genre" });
      continue;
    }
    const name = raw.toLowerCase();

    let genreDoc = await Genre.findOne({ name });
    if (genreDoc) {
      summary.genresReused += 1;
    } else {
      genreDoc = await Genre.create({ name });
      summary.genresCreated += 1;
    }

    await Books.updateOne({ _id: book._id }, { $set: { genre: genreDoc._id } });
    summary.booksUpdated += 1;
  }

  // Also seed any genres referenced by ObjectId that may not exist (orphan refs)
  const refIds = await Books.distinct("genre", {
    genre: { $type: "objectId" },
  });
  const existingIds = await Genre.find({ _id: { $in: refIds } })
    .select("_id")
    .lean();
  const existingSet = new Set(existingIds.map((g) => String(g._id)));
  const orphans = refIds.filter((id) => !existingSet.has(String(id)));

  res.status(200).json({
    success: true,
    message: "Genre migration complete",
    summary,
    orphanGenreRefs: orphans,
  });
});

// ─── Cleanup: delete Genre docs that no longer have any books ───────────────

export const cleanupEmptyGenres = AsyncErrorHandler(async (req, res, next) => {
  // Collect every genre id currently referenced by at least one book.
  const usedIds = await Books.distinct("genre");
  const usedSet = new Set(usedIds.map((id) => String(id)));

  const allGenres = await Genre.find().select("_id name").lean();
  const empty = allGenres.filter((g) => !usedSet.has(String(g._id)));

  if (empty.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No empty genres to remove",
      deletedCount: 0,
      deleted: [],
    });
  }

  const ids = empty.map((g) => g._id);
  await Genre.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
    message: "Empty genres removed",
    deletedCount: empty.length,
    deleted: empty.map((g) => ({ _id: g._id, name: g.name })),
  });
});
