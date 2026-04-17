import mongoose from "mongoose";

const Database = async () => {
  try {
    const uri = process.env.URI; // move inside function

    if (!uri) {
      throw new Error("MongoDB URI is not defined in .env");
    }

    await mongoose.connect(uri);
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
};

export default Database;
