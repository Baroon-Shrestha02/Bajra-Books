import cloudinary from "cloudinary";

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/avif",
  "image/heic",
];

const CLOUDINARY_FOLDER = "books";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const validateFile = (file) => {
  if (!file || !file.tempFilePath) {
    throw new Error("Invalid file object — missing tempFilePath");
  }
  if (!ALLOWED_EXTENSIONS.includes(file.mimetype)) {
    throw new Error(
      `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
    );
  }
};

const uploadSingle = async (file) => {
  validateFile(file);

  const result = await cloudinary.uploader.upload(file.tempFilePath, {
    folder: CLOUDINARY_FOLDER,
    resource_type: "image",
    transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
  });

  if (!result?.secure_url) {
    throw new Error("Cloudinary upload failed — no URL returned");
  }

  return {
    public_id: result.public_id,
    url: result.secure_url,
  };
};

// ─── Exported Helpers ─────────────────────────────────────────────────────────

/**
 * Upload one or multiple images to Cloudinary.
 * @param {object | object[]} files - Single file or array of files from express-fileupload
 * @returns {object | object[]} - { public_id, url } or array of them
 */
const uploadImages = async (files) => {
  const fileArray = Array.isArray(files) ? files : [files];
  const isSingleFile = fileArray.length === 1;

  const uploaded = await Promise.all(fileArray.map(uploadSingle));

  return isSingleFile ? uploaded[0] : uploaded;
};

/**
 * Delete one or multiple images from Cloudinary by public_id.
 * @param {string | string[]} publicIds
 */
const deleteImages = async (publicIds) => {
  const ids = Array.isArray(publicIds) ? publicIds : [publicIds];

  const results = await Promise.all(
    ids.map((id) => cloudinary.uploader.destroy(id)),
  );

  const failed = results.filter((r) => r.result !== "ok");
  if (failed.length) {
    console.warn("Some images failed to delete:", failed);
  }

  return results;
};

/**
 * Replace an existing image — deletes old one and uploads new.
 * @param {string} oldPublicId
 * @param {object} newFile
 * @returns {object} - { public_id, url }
 */
const replaceImage = async (oldPublicId, newFile) => {
  await deleteImages(oldPublicId);
  return uploadSingle(newFile);
};

export { uploadImages, deleteImages, replaceImage };
