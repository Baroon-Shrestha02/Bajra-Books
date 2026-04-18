import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import GlobalErrorHandler from "./Middlewares/GlobalErrorHandler.js";
import authRoutes from "./Routes/AuthRoutes.js";
import userRoutes from "./Routes/UserRoutes.js";
import bookRoutes from "./Routes/BooksRoutes.js";
import offerRoutes from "./Routes/OfferRoutes.js";
import cartRoutes from "./Routes/CartRoutes.js";
import orderRoutes from "./Routes/OrderRoutes.js";

import expireOffers from "./Utils/ExpireOffers.js";

const app = express();

app.use(
  cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for form data

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }),
);

// app.use(expireOffers);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/book", bookRoutes);
app.use("/api/offer", offerRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);

app.use(GlobalErrorHandler);

export default app;
