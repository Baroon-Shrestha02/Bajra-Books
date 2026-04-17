import AppError from "../Middlewares/AppError.js";
import AsyncErrorHandler from "../Middlewares/AsyncErrorHandler.js";
import User from "../Models/UserModel.js";
import { uploadImages } from "../Utils/ImageUploader.js";

export const updateProfile = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;

  const { firstname, middlename, lastname, phone, email } = req.body || {};

  const user = await User.findById(userId);
  if (!user) return next(new AppError("User not found", 404));

  // update profile image
  if (req.files && req.files.profileImage) {
    // if (user.profileImage && user.profImg.public_id) {
    //   await cloudinary.v2.uploader.destroy(user.profileImage.public_id);
    // }

    const profileImage = await replaceImage(
      book.profileImage.public_id,
      req.files.profileImage,
    );
    user.profileImage = uploadedImage;
  }

  // update fields if provided
  if (firstname) user.firstname = firstname;
  if (middlename) user.middlename = middlename;
  if (lastname) user.lastname = lastname;
  if (phone) user.phone = phone;
  if (email) user.email = email;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});
