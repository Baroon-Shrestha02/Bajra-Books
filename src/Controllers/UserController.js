import AppError from "../Middlewares/AppError.js";
import AsyncErrorHandler from "../Middlewares/AsyncErrorHandler.js";
import User from "../Models/UserModel.js";
import { replaceImage, uploadImages } from "../Utils/ImageUploader.js";

export const updateProfile = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;

  const { firstname, middlename, lastname, phone, email } = req.body || {};

  const user = await User.findById(userId);
  if (!user) return next(new AppError("User not found", 404));

  // ─── Update Profile Image ─────────────────────────────────────────────────

  if (req.files?.profileImage) {
    const profileImage = user.profileImage?.public_id
      ? await replaceImage(user.profileImage.public_id, req.files.profileImage)
      : await uploadImages(req.files.profileImage);

    if (!profileImage?.url) {
      return next(new AppError("Image upload failed", 500));
    }

    user.profileImage = {
      public_id: profileImage.public_id,
      url: profileImage.url,
    };
  }

  // ─── Update Fields ────────────────────────────────────────────────────────

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
