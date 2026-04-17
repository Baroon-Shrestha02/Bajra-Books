import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import GlobalErrorHandler from "./Middlewares/GlobalErrorHandler.js";
import authRoutes from "./Routes/AuthRoutes.js";
import userRoutes from "./Routes/UserRoutes.js";

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

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.use(GlobalErrorHandler);

export default app;
