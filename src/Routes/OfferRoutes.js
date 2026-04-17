import express from "express";
import {
  createOffer,
  getAllOffers,
  getSingleOffer,
  updateOffer,
} from "../Controllers/Books/OfferController.js";
import { protect } from "../Middlewares/VerifyUser.js";
import { restrictTo } from "../Middlewares/RestictAccess.js";

const router = express.Router();

router.post("/create", protect, restrictTo("admin"), createOffer);
router.get("/", getAllOffers);
router.get("/:id", getSingleOffer);
router.patch("/update/:id", protect, restrictTo("admin"), updateOffer);

export default router;

// import cron from "node-cron";

// // runs every hour
// cron.schedule("0 * * * *", async () => {
//   const now = new Date();

//   const expiredOffers = await Offer.find({ endDate: { $lte: now }, isActive: true });

//   if (expiredOffers.length === 0) return;

//   await Promise.all(
//     expiredOffers.map(async (offer) => {
//       await clearBooksOffer(offer.books);
//       offer.isActive = false;
//       await offer.save();
//       console.log(`Offer "${offer.name}" expired and disbanded.`);
//     })
//   );
// });
