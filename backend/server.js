const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const costRoutes = require("./routes/costRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "AI Cloud Cost Optimizer Backend is running!"
  });
});

// PostgreSQL connection test
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time;");

    res.json({
      success: true,
      database: "PostgreSQL",
      message: "PostgreSQL connection successful",
      current_time: result.rows[0].current_time
    });
  } catch (error) {
    console.error("PostgreSQL query error:", error.message);

    res.status(500).json({
      success: false,
      database: "PostgreSQL",
      message: "PostgreSQL connection failed",
      error: error.message
    });
  }
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/costs", costRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  pool.query("SELECT NOW()", (err, result) => {
    if (err) {
      console.error(`PostgreSQL connection failed: ${err.message}`);
    } else {
      console.log("PostgreSQL connected successfully");
    }
  });
});

// Server error handler
server.on("error", (error) => {
  console.error("Server error:", error);
});

// Keep process alive and catch unexpected errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Promise Rejection:", error);
});