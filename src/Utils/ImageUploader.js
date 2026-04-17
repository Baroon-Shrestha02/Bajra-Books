import cloudinary from "cloudinary";

const uploadImages = async (files) => {
  const allowedExtensions = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/avif",
    "image/heic",
  ];

  const fileArray = Array.isArray(files) ? files : [files];
  const isSingleFile = fileArray.length === 1;

  const uploadedFiles = [];

  for (const file of fileArray) {
    if (!allowedExtensions.includes(file.mimetype)) {
      throw new Error(`Invalid file type: ${file.mimetype}`);
    }

    try {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "inquiries",
        resource_type: "auto", // handles pdf, docx, etc.
      });

      if (!result || result.error) {
        throw new Error("Error uploading the file");
      }

      uploadedFiles.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error("An error occurred while uploading files");
    }
  }

  return isSingleFile ? uploadedFiles[0] : uploadedFiles;
};

export { uploadImages };
