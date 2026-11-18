
const express = require("express");

const {
  getAllRoutingRules,
  getRoutingRuleById,
  createRoutingRule,
  updateRoutingRule,
  updateRoutingRuleStatus,
} = require("../controllers/routingRuleController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Only administrators can manage routing rules.
router.use(protect, authorize("ADMIN"));

router.get("/", getAllRoutingRules);
router.post("/", createRoutingRule);
router.get("/:id", getRoutingRuleById);
router.patch("/:id", updateRoutingRule);
router.patch("/:id/status", updateRoutingRuleStatus);

module.exports = router;
