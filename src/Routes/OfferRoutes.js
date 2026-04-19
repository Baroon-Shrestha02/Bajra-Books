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

/**
 * @swagger
 * /offer/create:
 *   post:
 *     tags: [Offers]
 *     summary: Create an offer (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [stock-clearance, festive, custom]
 *               discount:
 *                 type: number
 *               bookIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/offer/create", protect, restrictTo("admin"), createOffer);

/**
 * @swagger
 * /offer:
 *   get:
 *     tags: [Offers]
 *     summary: Get all offers
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/offer", getAllOffers);

/**
 * @swagger
 * /offer/{id}:
 *   get:
 *     tags: [Offers]
 *     summary: Get single offer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/offer/:id", getSingleOffer);

/**
 * @swagger
 * /offer/update/{id}:
 *   patch:
 *     tags: [Offers]
 *     summary: Update offer (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [stock-clearance, festive, custom]
 *               discount:
 *                 type: number
 *               addBookIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               removeBookIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               endDate:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.patch("/offer/update/:id", protect, restrictTo("admin"), updateOffer);

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
