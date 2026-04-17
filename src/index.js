import dotenv from "dotenv";
dotenv.config();

import cloudinary from "cloudinary";
import app from "./app.js";
import Database from "./Config/Database.js";
import createAdminIfNotExists from "./Utils/CreateAdmin.js";

const PORT = process.env.PORT || 3000;

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

Database()
  .then(async () => {
    await createAdminIfNotExists(); // 👈 runs once safely

    // await import("./Cron/OfferExpiry.js");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
