
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { rateLimit } = require("express-rate-limit");
const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// Security middleware
app.use(helmet());

// Cross-origin requests
// Cross-origin requests
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (Thunder Client, mobile apps, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Parse incoming JSON
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan("dev"));

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
  message: {
    success: false,
    message: "Too many requests. Please try again after 15 minutes.",
  },
});

// Apply general rate limiting to API endpoints
// Health check is excluded through the skip condition above.
app.use("/api", apiLimiter);

// Authentication routes
app.use("/api/auth", require("./routes/authRoutes"));

// Citizen reports routes
app.use("/api/reports", require("./routes/reportRoutes"));

// Administrator report management routes
app.use("/api/admin", require("./routes/adminReportRoutes"));

app.use("/api/admin/citizens", require("./routes/adminCitizenRoutes"));

app.use("/api/notifications", require("./routes/notificationRoutes"));

app.use("/api/admin/departments", require("./routes/departmentRoutes"));

app.use("/api/admin/categories", require("./routes/categoryRoutes"));

app.use("/api/admin/routing-rules", require("./routes/routingRuleRoutes"));

app.use("/api/admin/analytics", require("./routes/analyticsRoutes"));

app.use("/api/public", require("./routes/publicRoutes"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pukaar API is running!",
    project: "Pukaar",
    timestamp: new Date().toISOString(),
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
