import bcrypt from "bcrypt";
import User from "../Models/UserModel.js";

const createAdminIfNotExists = async () => {
  try {
    const adminExists = await User.findOne({ email: "admin@gmail.com" });

    if (adminExists) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
      firstname: "Bajra",
      lastname: "Admin",
      phone: "98123458",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created successfully");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
};

export default createAdminIfNotExists;
