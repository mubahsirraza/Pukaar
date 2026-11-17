
require("dotenv").config();

const app = require("./app");
const { connectDB, disconnectDB } = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Pukaar API running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log("\nShutting down Pukaar server...");

      server.close(async () => {
        await disconnectDB();
        console.log("Database disconnected. Server stopped.");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (error) {
    console.error("Failed to start Pukaar server:", error.message);
    await disconnectDB();
    process.exit(1);
  }
};

startServer();
