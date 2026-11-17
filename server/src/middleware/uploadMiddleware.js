
const multer = require("multer");

// Store uploaded files temporarily in memory
const storage = multer.memoryStorage();

// Allow only supported image formats
const fileFilter = (req, file, callback) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error("Only JPG, PNG, and WEBP images are allowed.")
    );
  }
};

// Configure Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

module.exports = upload;
