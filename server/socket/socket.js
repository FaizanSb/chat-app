const { Server } = require("socket.io");

const onlineUsers = {};

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    socket.on("join", (userId) => {

      socket.userId = userId;

      onlineUsers[userId] = socket.id;

      io.emit("online_users", Object.keys(onlineUsers));

      console.log(onlineUsers);

    });

    socket.on("send_message", (data) => {
      const receiverSocket = onlineUsers[data.receiver.toString()];

      if (receiverSocket) {
        io.to(receiverSocket).emit("receive_message", data);
      }
    });

    socket.on("disconnect", () => {

      delete onlineUsers[socket.userId];

      io.emit("online_users", Object.keys(onlineUsers));

      console.log(onlineUsers);

    });
  });
}

module.exports = initializeSocket;