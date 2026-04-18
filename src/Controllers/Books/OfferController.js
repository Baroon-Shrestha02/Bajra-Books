import AppError from "../../Middlewares/AppError.js";
import AsyncErrorHandler from "../../Middlewares/AsyncErrorHandler.js";
import Books from "../../Models/BooksModel.js";
import Offer from "../../Models/OfferModel.js";

const OFFER_TYPES = ["stock-clearance", "festive", "custom"];

export const createOffer = AsyncErrorHandler(async (req, res, next) => {
  const { name, type, discount, bookIds, startDate, endDate } = req.body;

  if (!name || !type || !discount || !bookIds || !endDate) {
    return next(
      new AppError(
        "name, type, discount, bookIds and endDate are required.",
        400,
      ),
    );
  }

  if (!OFFER_TYPES.includes(type)) {
    return next(
      new AppError(`Invalid type. Allowed: ${OFFER_TYPES.join(", ")}`, 400),
    );
  }

  if (Number(discount) < 1 || Number(discount) > 100) {
    return next(new AppError("Discount must be between 1 and 100.", 400));
  }

  if (!Array.isArray(bookIds) || bookIds.length === 0) {
    return next(new AppError("bookIds must be a non-empty array.", 400));
  }

  if (new Date(endDate) <= new Date()) {
    return next(new AppError("End date must be in the future.", 400));
  }

  if (startDate && new Date(startDate) >= new Date(endDate)) {
    return next(new AppError("Start date must be before end date.", 400));
  }

  const books = await Books.find({ _id: { $in: bookIds } });

  if (books.length === 0) {
    return next(new AppError("No books found with the provided IDs.", 404));
  }

  if (books.length !== bookIds.length) {
    const foundIds = books.map((b) => b._id.toString());
    const notFound = bookIds.filter((id) => !foundIds.includes(id));
    return next(new AppError(`Books not found: ${notFound.join(", ")}`, 404));
  }

  const offer = await Offer.create({
    name,
    type,
    discount: Number(discount),
    books: bookIds,
    startDate: startDate ? new Date(startDate) : Date.now(),
    endDate: new Date(endDate),
    isActive: true,
  });

  await Promise.all(
    books.map((book) => {
      book.offer.isOnOffer = true;
      book.offer.offerDiscount = Number(discount);
      book.offer.offerId = offer._id;
      return book.save();
    }),
  );

  res.status(201).json({
    success: true,
    message: `Offer "${name}" created and applied to ${books.length} book(s).`,
    offer,
  });
});

export const getAllOffers = AsyncErrorHandler(async (req, res, next) => {
  const now = new Date();

  // ─── Auto-expire offers past endDate ──────────────────────────────────────

  const expiredOffers = await Offer.find({
    endDate: { $lte: now },
    isActive: true,
  });

  if (expiredOffers.length > 0) {
    await Promise.all(
      expiredOffers.map(async (offer) => {
        await Books.updateMany(
          { _id: { $in: offer.books } },
          {
            $set: {
              "offer.isOnOffer": false,
              "offer.offerDiscount": 0,
              "offer.offerPrice": null,
              "offer.offerId": null,
            },
          },
        );
        offer.isActive = false;
        return offer.save();
      }),
    );
  }

  // ─── Fetch All Offers ─────────────────────────────────────────────────────

  const offers = await Offer.find().populate(
    "books",
    "title author price offer cover_Img",
  );

  res.status(200).json({
    success: true,
    total: offers.length,
    offers,
  });
});

export const getSingleOffer = AsyncErrorHandler(async (req, res, next) => {
  const offer = await Offer.findById(req.params.id).populate(
    "books",
    "title author original_price price offer cover_Img genre category",
  );

  if (!offer) return next(new AppError("Offer not found.", 404));

  // ─── Check if expired ─────────────────────────────────────────────────────

  if (offer.isActive && new Date(offer.endDate) <= new Date()) {
    await Books.updateMany(
      { _id: { $in: offer.books } },
      {
        $set: {
          "offer.isOnOffer": false,
          "offer.offerDiscount": 0,
          "offer.offerPrice": null,
          "offer.offerId": null,
        },
      },
    );
    offer.isActive = false;
    await offer.save();
  }

  res.status(200).json({
    success: true,
    offer,
  });
});

export const updateOffer = AsyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, type, discount, addBookIds, removeBookIds, endDate } = req.body;

  const offer = await Offer.findById(id);
  if (!offer) return next(new AppError("Offer not found.", 404));
  if (!offer.isActive)
    return next(new AppError("Cannot update an expired offer.", 400));

  if (removeBookIds && removeBookIds.length > 0) {
    const booksToRemove = await Books.find({ _id: { $in: removeBookIds } });

    await Promise.all(
      booksToRemove.map((book) => {
        book.offer.isOnOffer = false;
        book.offer.offerDiscount = 0;
        book.offer.offerPrice = null;
        book.offer.offerId = null;
        return book.save();
      }),
    );

    offer.books = offer.books.filter(
      (bookId) => !removeBookIds.includes(bookId.toString()),
    );
  }

  if (addBookIds && addBookIds.length > 0) {
    const existingIds = offer.books.map((b) => b.toString());
    const duplicates = addBookIds.filter((id) => existingIds.includes(id));

    if (duplicates.length > 0) {
      return next(
        new AppError(`Books already in offer: ${duplicates.join(", ")}`, 400),
      );
    }

    const booksToAdd = await Books.find({ _id: { $in: addBookIds } });

    if (booksToAdd.length !== addBookIds.length) {
      return next(new AppError("One or more book IDs not found.", 404));
    }

    await Promise.all(
      booksToAdd.map((book) => {
        book.offer.isOnOffer = true;
        book.offer.offerDiscount = offer.discount;
        book.offer.offerId = offer._id;
        return book.save();
      }),
    );

    offer.books.push(...addBookIds);
  }

  if (name) offer.name = name;
  if (type) offer.type = type;
  if (endDate) offer.endDate = new Date(endDate);
  if (discount !== undefined) {
    offer.discount = Number(discount);

    const allBooks = await Books.find({ _id: { $in: offer.books } });
    await Promise.all(
      allBooks.map((book) => {
        book.offer.offerDiscount = Number(discount);
        return book.save();
      }),
    );
  }

  await offer.save();

  res.status(200).json({
    success: true,
    message: "Offer updated successfully.",
    offer,
  });
});
