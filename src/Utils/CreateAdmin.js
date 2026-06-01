import bcrypt from "bcrypt";
import User from "../Models/UserModel.js";

const createAdminIfNotExists = async () => {
  try {
    const adminExists = await User.findOne({ email: "bajraadmin@gmail.com" });

    if (adminExists) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("bajraadmin123", 10);

    await User.create({
      firstname: "Bajra",
      lastname: "Admin",
      phone: "1234567812",
      email: "bajraadmin@gmail.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created successfully");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
};

export default createAdminIfNotExists;
