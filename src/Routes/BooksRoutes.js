import express from "express";
import {
  addBooks,
  deleteBook,
  getBooks,
  updateBook,
} from "../Controllers/Books/BooksConroller.js";
import { protect } from "../Middlewares/VerifyUser.js";

const router = express.Router();

router.get("/", getBooks);
router.post("/add", addBooks);
router.delete("/delete/:id", deleteBook);
router.patch("/update/:id", updateBook);

export default router;
