const { Server } = require("socket.io");
const Message = require("../models/Message");

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

    socket.on("send_message", async (data) => {


      const receiverSocket = onlineUsers[data.receiver];


      const message = await Message.create({

        sender: data.sender,

        receiver: data.receiver,

        text: data.text,

      });

      // sender ko bhi message return karo
      socket.emit(
        "receive_message",
        message
      );

      // receiver online hai

      if (receiverSocket) {

        message.delivered = true;
        await message.save();

        io.to(receiverSocket).emit("receive_message", message);

        // NEW: sender ko bata do ke message deliver ho gaya
        socket.emit("message_delivered", message._id);
      }

    });

    socket.on("typing", ({ sender, receiver }) => {

      const receiverSocket = onlineUsers[receiver];

      if (receiverSocket) {
        io.to(receiverSocket).emit("user_typing", { sender });
      }

    });

    socket.on(
      "message_seen",
      async ({ messageId, senderId }) => {


        await Message.findByIdAndUpdate(
          messageId,
          {
            isSeen: true
          }
        );


        const senderSocket =
          onlineUsers[senderId];


        if (senderSocket) {

          io.to(senderSocket)
            .emit(
              "message_seen",
              messageId
            );

        }


      });

    socket.on("stop_typing", ({ receiver }) => {

      const receiverSocket = onlineUsers[receiver];

      if (receiverSocket) {
        io.to(receiverSocket).emit("user_stop_typing");
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