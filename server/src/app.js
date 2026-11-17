
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

// Security middleware
app.use(helmet());

// Cross-origin requests
app.use(cors());

// Parse incoming JSON
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan("dev"));

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

module.exports = app;
