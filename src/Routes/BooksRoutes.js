import express from "express";
import {
  addBooks,
  deleteBook,
  getBooks,
  updateBook,
} from "../Controllers/Books/BooksConroller.js";
import { protect } from "../Middlewares/VerifyUser.js";
import { restrictTo } from "../Middlewares/RestictAccess.js";

const router = express.Router();

router.get("/", getBooks);
router.post("/add", protect, restrictTo("admin"), addBooks);
router.delete("/delete/:id", protect, restrictTo("admin"), deleteBook);
router.patch("/update/:id", protect, restrictTo("admin"), updateBook);

export default router;
