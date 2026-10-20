require("dotenv").config();

if (process.env.USE_CUSTOM_DNS === "true") {
  require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
}

const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const audioRoutes = require("./routes/audioRoutes");

const connectDB = require("./config/db");
const initializeSocket = require("./socket/socket");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Root route
app.get("/", (req, res) => {
  res.send("Server is running smoothly!");
});

// Static files
app.use(
  "/uploads/audio",
  express.static(path.join(process.cwd(), "uploads", "audio"))
);
app.use(
  "/uploads/profile",
  express.static(path.join(process.cwd(), "uploads", "profile"))
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/audio", audioRoutes);

// Start server
const startServer = async () => {
  try {
    // const dns = require("dns");
    // dns.setServers(["8.8.8.8", "1.1.1.1"]);

    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();