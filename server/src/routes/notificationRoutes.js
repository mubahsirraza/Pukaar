
const express = require("express");

const {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// All notification routes require citizen authentication.
router.use(protect, authorize("CITIZEN"));

// Get all notifications.
router.get("/", getMyNotifications);

// Get unread notification count.
router.get("/unread-count", getUnreadNotificationCount);

// Mark all notifications as read.
router.patch("/read-all", markAllNotificationsAsRead);

// Mark one notification as read.
router.patch("/:id/read", markNotificationAsRead);

module.exports = router;
