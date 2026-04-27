import AppError from "../Middlewares/AppError.js";
import AsyncErrorHandler from "../Middlewares/AsyncErrorHandler.js";
import Promo from "../Models/PromoModel.js";


export const createPromo = AsyncErrorHandler(async (req, res, next) => {
  const { name, couponCode, discount, maxUses } = req.body;

  if (!name || !couponCode || !discount) {
    return next(new AppError("name, couponCode and discount are required.", 400));
  }

  if (Number(discount) < 1 || Number(discount) > 100) {
    return next(new AppError("Discount must be between 1 and 100.", 400));
  }

  const existing = await Promo.findOne({ couponCode: couponCode.toUpperCase() });
  if (existing) return next(new AppError("Coupon code already exists.", 409));

  const promo = await Promo.create({
    name,
    couponCode: couponCode.toUpperCase(),
    discount: Number(discount),
    maxUses: maxUses ? Number(maxUses) : 1,
  });

  res.status(201).json({
    success: true,
    message: "Promo code created successfully.",
    promo,
  });
});

// ─── Get All Promos ───────────────────────────────────────────────────────────

export const getAllPromos = AsyncErrorHandler(async (req, res, next) => {
  const promos = await Promo.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    total: promos.length,
    promos,
  });
});

// ─── Update Promo ─────────────────────────────────────────────────────────────

export const updatePromo = AsyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, discount, maxUses, isActive } = req.body;

  const promo = await Promo.findById(id);
  if (!promo) return next(new AppError("Promo not found.", 404));

  if (discount !== undefined && (Number(discount) < 1 || Number(discount) > 100)) {
    return next(new AppError("Discount must be between 1 and 100.", 400));
  }

  if (name) promo.name = name;
  if (discount !== undefined) promo.discount = Number(discount);
  if (maxUses !== undefined) promo.maxUses = maxUses ? Number(maxUses) : null;
  if (isActive !== undefined) promo.isActive = isActive;

  await promo.save();

  res.status(200).json({
    success: true,
    message: "Promo updated successfully.",
    promo,
  });
});

// ─── Delete Promo ─────────────────────────────────────────────────────────────

export const deletePromo = AsyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const promo = await Promo.findById(id);
  if (!promo) return next(new AppError("Promo not found.", 404));

  await Promo.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Promo deleted successfully.",
  });
});