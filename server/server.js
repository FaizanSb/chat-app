const express = require('express');
const cors = require('cors');
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
require("dotenv").config(); // Load environment variables from .env file
const http = require("http");
const initializeSocket = require("./socket/socket");

const app = express();

app.use(cors());
const PORT = process.env.PORT || 5000;

const connectDB = require("./config/db");

connectDB();

// Middleware to parse incoming JSON payloads
app.use(express.json());
const server = http.createServer(app); // Create an HTTP server using the Express app

initializeSocket(server); // Initialize the socket.io server with the HTTP server

// Root route
app.get('/', (req, res) => {
  res.send('Server is running smoothly!');
});

app.use("/api/auth", authRoutes); // Use the auth routes for authentication-related endpoints

app.use("/api/users", userRoutes); // Use the user routes for user-related endpoints
// Start listening for requests

app.use("/api/messages", messageRoutes); // Use the message routes for message-related endpoints

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
