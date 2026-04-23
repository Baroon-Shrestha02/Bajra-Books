// src/Cron/offerExpiry.js

import cron from "node-cron";
import Offer from "../Models/OfferModel.js";
import Books from "../Models/BooksModel.js";

const CHUNK_SIZE = 10;

cron.schedule("0 * * * *", async () => {
  // runs every 5 minutes
  // cron.schedule("*/5 * * * *", async () => {
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

    console.log(
      `📦 Processing ${expiredOffers.length} expired offers in chunks of ${CHUNK_SIZE}`,
    );

    for (let i = 0; i < expiredOffers.length; i += CHUNK_SIZE) {
      const chunk = expiredOffers.slice(i, i + CHUNK_SIZE);

      await Promise.all(
        chunk.map(async (offer) => {
          // ─── Clear offer fields from all books ───────────────────────────
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

          // ─── Delete offer from DB ─────────────────────────────────────────
          await Offer.findByIdAndDelete(offer._id);
          console.log(`🗑️  Offer "${offer.name}" expired and deleted.`);
        }),
      );

      console.log(`✅ Chunk ${Math.ceil((i + 1) / CHUNK_SIZE)} done`);
    }
  } catch (error) {
    console.error("❌ Cron job error:", error);
  }
});
