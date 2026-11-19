const express = require("express");

const {
  getAllReports,
  getReportsForMap,
  getAdminReportById,
  verifyReport,
  rejectReport,
  markReportAsDuplicate,
  updateReportStatus,
} = require("../controllers/adminReportController");

const {
  retryAIClassification,
} = require("../controllers/aiRetryController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Only authenticated administrators can access these routes.
router.use(protect, authorize("ADMIN"));

// Get all reports with optional filters and pagination.
router.get("/reports", getAllReports);
router.get("/reports/map", getReportsForMap);
router.get("/reports/:id", getAdminReportById);

// Verify a report and assign it to the responsible department.
router.patch("/reports/:id/verify", verifyReport);

// Reject a report with a mandatory reason.
router.patch("/reports/:id/reject", rejectReport);

router.patch("/reports/:id/duplicate", markReportAsDuplicate);

router.patch("/reports/:id/status", updateReportStatus);

// Retry AI classification for a report whose previous AI analysis failed.
router.post("/reports/:id/retry-ai", retryAIClassification);

module.exports = router;