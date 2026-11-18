
const express = require("express");

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
} = require("../controllers/categoryController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Only authenticated administrators can manage categories.
router.use(protect, authorize("ADMIN"));

// Get all categories.
router.get("/", getAllCategories);

// Create a category.
router.post("/", createCategory);

// Get one category.
router.get("/:id", getCategoryById);

// Update category details.
router.patch("/:id", updateCategory);

// Activate or deactivate a category.
router.patch("/:id/status", updateCategoryStatus);

module.exports = router;
