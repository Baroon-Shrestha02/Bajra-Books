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

export const getOffer = AsyncErrorHandler(async (req, res, next) => {});

export const updateOffer = AsyncErrorHandler(async (req, res, next) => {});
