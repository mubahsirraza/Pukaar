
const express = require("express");

const {
  getPublicStats,
  getPublicCategoryStats,
  getPublicSeverityStats,
  getPublicTrends,
  getPublicHotspots,
} = require("../controllers/publicAnalyticsController");

const router = express.Router();

// Public endpoints — no authentication required
router.get("/stats", getPublicStats);
router.get("/categories", getPublicCategoryStats);
router.get("/severity", getPublicSeverityStats);
router.get("/trends", getPublicTrends);
router.get("/hotspots", getPublicHotspots);

module.exports = router;
