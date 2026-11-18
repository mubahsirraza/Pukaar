
const express = require("express");

const {
  getOverviewStats,
  getReportsByStatus,
  getReportsByCategory,
  getReportsBySeverity,
  getReportsByDepartment,
  getMonthlyReportTrends,
  getResolutionMetrics,
} = require("../controllers/analyticsController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin access only
router.use(protect, authorize("ADMIN"));

// Analytics endpoints
router.get("/overview", getOverviewStats);
router.get("/by-status", getReportsByStatus);
router.get("/by-category", getReportsByCategory);
router.get("/by-severity", getReportsBySeverity);
router.get("/by-department", getReportsByDepartment);
router.get("/monthly", getMonthlyReportTrends);
router.get("/resolution", getResolutionMetrics);

module.exports = router;
