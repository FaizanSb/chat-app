
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

    // User online
    socket.on("join", (userId) => {
      if (!userId) return;

      socket.userId = String(userId);
      onlineUsers[String(userId)] = socket.id;

      io.emit("online_users", Object.keys(onlineUsers));

      console.log("Online users:", onlineUsers);
    });

    // Send text or audio message
    socket.on("send_message", async (data) => {
      try {
        const { sender, receiver } = data;

        const messageType = data.messageType || "text";

        if (!sender || !receiver) {
          socket.emit("message_error", {
            message: "Sender and receiver are required.",
          });
          return;
        }

        if (!["text", "audio"].includes(messageType)) {
          socket.emit("message_error", {
            message: "Invalid message type.",
          });
          return;
        }

        // Validate text message
        if (
          messageType === "text" &&
          (!data.text || !data.text.trim())
        ) {
          socket.emit("message_error", {
            message: "Text message cannot be empty.",
          });
          return;
        }

        // Validate audio message
        if (
          messageType === "audio" &&
          (typeof data.audioUrl !== "string" ||
            !data.audioUrl.trim())
        ) {
          socket.emit("message_error", {
            message: "Audio URL is required.",
          });
          return;
        }

        const receiverSocket = onlineUsers[String(receiver)];

        // Save message in MongoDB
        const message = await Message.create({
          sender,
          receiver,
          messageType,
          text:
            messageType === "text"
              ? data.text.trim()
              : "",
          audioUrl:
            messageType === "audio"
              ? data.audioUrl
              : null,
          delivered: Boolean(receiverSocket),
        });

        // Send message to sender
        socket.emit("receive_message", message);

        // Send message to receiver if online
        if (receiverSocket) {
          io.to(receiverSocket).emit(
            "receive_message",
            message
          );

          // Update sender's delivery status
          socket.emit("message_delivered", message._id);
        }
      } catch (error) {
        console.error("Send message error:", error);

        socket.emit("message_error", {
          message: "Message could not be sent.",
        });
      }
    });

    // Typing indicator
    socket.on("typing", ({ sender, receiver }) => {
      const receiverSocket = onlineUsers[String(receiver)];

      if (receiverSocket) {
        io.to(receiverSocket).emit("user_typing", {
          sender,
        });
      }
    });

    // Stop typing
    socket.on("stop_typing", ({ receiver }) => {
      const receiverSocket = onlineUsers[String(receiver)];

      if (receiverSocket) {
        io.to(receiverSocket).emit("user_stop_typing");
      }
    });

    // Message seen
    socket.on(
      "message_seen",
      async ({ messageId, senderId }) => {
        try {
          await Message.findByIdAndUpdate(messageId, {
            isSeen: true,
          });

          const senderSocket = onlineUsers[String(senderId)];

          if (senderSocket) {
            io.to(senderSocket).emit(
              "message_seen",
              messageId
            );
          }
        } catch (error) {
          console.error("Message seen error:", error);
        }
      }
    );

    // User disconnect
    socket.on("disconnect", () => {
      if (socket.userId) {
        // Avoid removing a newer connection for the same user
        if (onlineUsers[socket.userId] === socket.id) {
          delete onlineUsers[socket.userId];
        }
      }

      io.emit("online_users", Object.keys(onlineUsers));

      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = initializeSocket;
