const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

// Environment validation
console.log("🔧 Checking environment configuration...");
if (process.env.OPENAI_API_KEY) {
  console.log("✅ OpenAI API key found");
} else {
  console.log("⚠️  OpenAI API key not found - AI features will use fallback");
}

if (process.env.MONGODB_URI) {
  console.log("✅ MongoDB URI configured");
} else {
  console.log("⚠️  MongoDB URI not found - using local MongoDB");
}

console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
console.log("🔧 Configuration complete\n");

// Middleware
app.use(helmet());
app.use(morgan("combined"));
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5174",
      "http://localhost:5174",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Smart Virtual Assistant API is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
try {
  const taskRoutes = require("./routes/taskRoutes");
  const aiRoutes = require("./routes/aiRoutes");

  app.use("/api/tasks", taskRoutes);
  app.use("/api/ai", aiRoutes);

  console.log("✅ Routes loaded successfully");
} catch (routeError) {
  console.error("❌ Error loading routes:", routeError);
  // Continue running even if routes fail to load
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    // Try to connect to MongoDB
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/smart-va"
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.log("Continuing without MongoDB - some features may not work");
    // Don't exit the process, continue without MongoDB
  }
};

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  console.log("🚀 Starting Smart Virtual Assistant Server...");

  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`\n🌟 ================================================`);
    console.log(`🚀 Smart VA Server running on port ${PORT}`);
    console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🤖 Frontend should connect to: http://localhost:${PORT}/api`);
    console.log(`🔗 API Endpoints:`);
    console.log(`   • POST ${PORT}/api/ai/chat - AI Chat`);
    console.log(`   • POST ${PORT}/api/tasks - Submit Tasks`);
    console.log(`   • GET  ${PORT}/api/tasks - Get All Tasks`);
    console.log(`================================================\n`);
  });

  // Handle graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(() => {
      console.log("Process terminated");
      mongoose.connection.close();
    });
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

module.exports = app;
