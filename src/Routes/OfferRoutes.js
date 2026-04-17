import express from "express";
import {
  createOffer,
  getAllOffers,
  getSingleOffer,
  updateOffer,
} from "../Controllers/Books/OfferController.js";

const router = express.Router();

router.post("/create", createOffer);
router.get("/", getAllOffers);
router.get("/:id", getSingleOffer);
router.patch("/update/:id", updateOffer);

export default router;
