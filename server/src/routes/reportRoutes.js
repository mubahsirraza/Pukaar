
const express = require("express");

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

// All citizen report routes require authentication.
router.use(protect, authorize("CITIZEN"));

// Get all reports belonging to the logged-in citizen.
router.get("/my-reports", getMyReports);

// Submit a new citizen report.
router.post("/", handleImageUpload, createReport);

// Get details of one citizen-owned report.
router.get("/:id", getReportById);

module.exports = router;
