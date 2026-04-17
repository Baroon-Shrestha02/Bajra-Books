// src/Utils/ExpireOffers.js

import Offer from "../Models/OfferModel.js";
import Books from "../Models/BooksModel.js";

const expireOffers = async (req, res, next) => {
  try {
    const now = new Date();

    // ─── Catch both expired and already deactivated offers ────────────────
    const expiredOffers = await Offer.find({
      $or: [{ endDate: { $lte: now }, isActive: true }, { isActive: false }],
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

          await Offer.findByIdAndDelete(offer._id);
          console.log(`🗑️ Offer "${offer.name}" deleted.`);
        }),
      );
    }
  } catch (error) {
    console.error("❌ Offer expiry error:", error);
  }

  next();
};

export default expireOffers;
