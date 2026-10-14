
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const http = require("http");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const audioRoutes = require("./routes/audioRoutes");

const connectDB = require("./config/db");
const initializeSocket = require("./socket/socket");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Root route
app.get("/", (req, res) => {
  res.send("Server is running smoothly!");
});

app.use(
  "/uploads/audio",
  express.static(require("path").join(process.cwd(), "uploads", "audio"))
);
// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/audio", audioRoutes);

// Start server
const startServer = async () => {
  try {
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
