
const express = require("express");

const {
  getAllCitizens,
  getCitizenById,
  updateCitizenStatus,
} = require("../controllers/adminCitizenController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Only authenticated administrators can manage citizens.
router.use(protect, authorize("ADMIN"));

// Get all citizens with search, filters and pagination.
router.get("/", getAllCitizens);

// Get an individual citizen and their report history.
router.get("/:id", getCitizenById);

// Activate or deactivate a citizen account.
router.patch("/:id/status", updateCitizenStatus);

module.exports = router;
