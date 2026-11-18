
const express = require("express");

const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
} = require("../controllers/departmentController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Only authenticated administrators can manage departments.
router.use(protect, authorize("ADMIN"));

// Get all departments.
router.get("/", getAllDepartments);

// Create a department.
router.post("/", createDepartment);

// Get one department.
router.get("/:id", getDepartmentById);

// Update department details.
router.patch("/:id", updateDepartment);

// Activate or deactivate a department.
router.patch("/:id/status", updateDepartmentStatus);

module.exports = router;
