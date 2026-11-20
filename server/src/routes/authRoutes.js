
const express = require("express");

const {
  body,
} = require("express-validator");

const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

const { protect, authorize } = require("../middleware/authMiddleware");
const { rateLimit } = require("express-rate-limit");
const { validateRequest } = require("../middleware/validationMiddleware");

const router = express.Router();

// Strict limit for login and registration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

// Registration validation
const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters."),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Password must be a string.")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters."),
];

// Login validation
const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Password is required.")
    .notEmpty()
    .withMessage("Password cannot be empty."),
];

// Public routes
router.post(
  "/register",
  authLimiter,
  registerValidation,
  validateRequest,
  register
);

router.post(
  "/login",
  authLimiter,
  loginValidation,
  validateRequest,
  login
);

// Protected routes
router.get("/me", protect, getMe);

// Admin profile management
router.patch(
  "/profile",
  protect,
  authorize("ADMIN"),
  updateProfile
);

// Admin password management
router.patch(
  "/change-password",
  protect,
  authorize("ADMIN"),
  changePassword
);

module.exports = router;
