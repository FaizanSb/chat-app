const express = require('express');
const cors = require('cors');
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
require("dotenv").config(); // Load environment variables from .env file
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
const PORT = process.env.PORT || 5000;

const connectDB = require("./config/db");

connectDB();
const onlineUsers = {}; // Object to keep track of online users

// Middleware to parse incoming JSON payloads
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {

  console.log("User Connected:", socket.id);

  socket.on("join", (userId) => {

    onlineUsers[userId] = socket.id;

    console.log("Online Users:", onlineUsers);
  });

  socket.on("send_message", (data) => {

    console.log("Message Received:", data);

    const receiverSocket = onlineUsers[data.receiver.toString()];

    console.log("Receiver Socket:", receiverSocket);

    if (receiverSocket) {
      io.to(receiverSocket).emit("receive_message", data);
      console.log("Message Sent");
    } else {
      console.log("Receiver Offline");
    }

  });
});
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
