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
import promoRoutes from "./Routes/PromoRoutes.js";
import swaggerUi from "swagger-ui-express";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ─── Swagger ──────────────────────────────────────────────────────────────────

const swaggerPath = join(__dirname, "swagger-output.json");

if (existsSync(swaggerPath)) {
  const swaggerFile = JSON.parse(readFileSync(swaggerPath, "utf-8"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
} else {
  console.warn("⚠️  swagger-output.json not found. Run: npm run swagger");
}

// ─── Middlewares ──────────────────────────────────────────────────────────────

const allowedOrigins = [
  /^http:\/\/localhost(:\d+)?$/, // matches localhost:3000, :3001, :5173, etc.
  "https://bajrabooks.com",
  "https://www.bajrabooks.com",
  "https://api.bajrabooks.com",
  "https://bajrabarahibooks.com",
  "https://www.bajrabarahibooks.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, curl)
      if (!origin) return callback(null, true);

      const allowed = allowedOrigins.some((o) =>
        typeof o === "string" ? o === origin : o.test(origin),
      );

      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }),
);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", bookRoutes);
app.use("/api", offerRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);
app.use("/api", promoRoutes);

app.use(GlobalErrorHandler);

export default app;
