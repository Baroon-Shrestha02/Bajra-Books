import express from "express";
import { createOffer } from "../Controllers/Books/OfferController.js";

const router = express.Router();

router.post("/create", createOffer);

export default router;
