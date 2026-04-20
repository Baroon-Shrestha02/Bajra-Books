import express from "express";
import {
  addBooks,
  deleteBook,
  getBooks,
  getWishlist,
  updateBook,
  wishList,
} from "../Controllers/Books/BooksConroller.js";
import { protect } from "../Middlewares/VerifyUser.js";
import { restrictTo } from "../Middlewares/RestictAccess.js";

const router = express.Router();

/**
 * @swagger
 * /book:
 *   get:
 *     tags: [Books]
 *     summary: Get all books
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: offer
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/book", getBooks);

/**
 * @swagger
 * /book/add:
 *   post:
 *     tags: [Books]
 *     summary: Add a new book (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               author:
 *                 type: string
 *               isbn:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               original_price:
 *                 type: number
 *               discount:
 *                 type: number
 *               stock:
 *                 type: number
 *               weight:
 *                 type: number
 *               genre:
 *                 type: string
 *               category:
 *                 type: string
 *               cover_Img:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/book/add", protect, restrictTo("admin"), addBooks);

/**
 * @swagger
 * /book/delete/{id}:
 *   delete:
 *     tags: [Books]
 *     summary: Delete a book (admin)
 *     security:
 *       - bearerAuth: []
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
router.delete("/book/delete/:id", protect, restrictTo("admin"), deleteBook);

/**
 * @swagger
 * /book/update/{id}:
 *   patch:
 *     tags: [Books]
 *     summary: Update a book (admin)
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               author:
 *                 type: string
 *               isbn:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               original_price:
 *                 type: number
 *               discount:
 *                 type: number
 *               stock:
 *                 type: number
 *               weight:
 *                 type: number
 *               genre:
 *                 type: string
 *               category:
 *                 type: string
 *               cover_Img:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: OK
 */
router.patch("/book/update/:id", protect, restrictTo("admin"), updateBook);

/**
 * @swagger
 * /book/add-fav/{id}:
 *   post:
 *     tags: [Books]
 *     summary: Toggle book in wishlist (user)
 *     security:
 *       - bearerAuth: []
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
router.post("/book/add-fav/:id", protect, restrictTo("user"), wishList);

/**
 * @swagger
 * /book/get-fav:
 *   get:
 *     tags: [User]
 *     summary: Get wishlist (user)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/book/get-fav", protect, restrictTo("user"), getWishlist);

export default router;
