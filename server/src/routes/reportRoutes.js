
const express = require("express");

const { body } = require("express-validator");

const {
  createReport,
  getMyReports,
  getReportById,
} = require("../controllers/reportController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const { validateRequest } = require("../middleware/validationMiddleware");

const router = express.Router();

// Handle image upload errors.
const handleImageUpload = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Image upload failed.",
      });
    }

    next();
  });
};

// Report submission validation
const reportValidation = [
  body("description")
    .isString()
    .withMessage("Description must be text.")
    .bail()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Description must be between 1 and 2000 characters."),

  body("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be a valid coordinate between -90 and 90.")
    .toFloat(),

  body("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be a valid coordinate between -180 and 180.")
    .toFloat(),
];

// All citizen report routes require authentication.
router.use(protect, authorize("CITIZEN"));

// Get all reports belonging to the logged-in citizen.
router.get("/my-reports", getMyReports);

// Submit a new citizen report.
router.post(
  "/",
  handleImageUpload,
  reportValidation,
  validateRequest,
  createReport
);

// Get details of one citizen-owned report.
router.get("/:id", getReportById);

module.exports = router;
