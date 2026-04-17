// src/Cron/offerExpiry.js

import cron from "node-cron";
import Offer from "../Models/OfferModel.js";
import Books from "../Models/BooksModel.js";

// runs every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    const now = new Date();
    console.log(`🕐 Cron running at ${now.toISOString()}`);

    const expiredOffers = await Offer.find({
      endDate: { $lte: now },
      isActive: true,
    });

    if (expiredOffers.length === 0) {
      console.log("✅ No expired offers found.");
      return;
    }

    await Promise.all(
      expiredOffers.map(async (offer) => {
        // ─── Clear offer fields from all books ───────────────────────────────
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

        // ─── Delete offer from DB ───────────────────────────────────────────
        await Offer.findByIdAndDelete(offer._id);
        console.log(`🗑️  Offer "${offer.name}" expired and deleted.`);
      }),
    );
  } catch (error) {
    console.error("❌ Cron job error:", error);
  }
});
