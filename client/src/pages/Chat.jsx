import { useEffect, useState, useRef } from "react";
import { getUsers } from "../services/userService";
import Loader from "../components/Loader";
import Sidebar from "../components/Sidebar";
import UserCard from "../components/UserCard";
import {
  sendMessage,
  getMessages,
} from "../services/messageService";
import socket from "../socket";

function Chat() {

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);

  //console.log("Current User:", currentUser);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    }
  }, [selectedUser]);

  // socket event listeners
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
      console.log(socket.id);

      socket.emit("join", currentUser.id);
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  // socket event listeners
  useEffect(() => {

    socket.on("online_users", (users) => {

      console.log("Online Users:", users);

      setOnlineUsers(users);

    });

    return () => {

      socket.off("online_users");

    };

  }, []);

  useEffect(() => {

    socket.on("receive_message", (message) => {

      console.log("New Message:", message);

      setMessages((prev) => [...prev, message]);

    });

    return () => {

      socket.off("receive_message");

    };

  }, []);

  useEffect(() => {
    const handleTyping = ({ sender }) => {

      if (sender !== selectedUser?._id) return;

      setIsTyping(true);
      // alert("User is typing...");

      clearTimeout(typingTimeout.current);

      typingTimeout.current = setTimeout(() => {
        setIsTyping(false);
      }, 1500);
    };

    const handleStopTyping = () => {
      setIsTyping(false);
    };

    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);

    return () => {
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
    };
  }, [selectedUser]);
  const fetchUsers = async () => {

    try {

      const data = await getUsers();

      console.log("Users Response:", data.users);

      setUsers(data.users);

    } catch (error) {

      console.error(error.message);

    }

  };

  const fetchMessages = async () => {

    if (!selectedUser) return;

    try {

      const data = await getMessages(
        currentUser.id,
        selectedUser._id
      );

      setMessages(data.messages);

    } catch (error) {

      console.error(error.message);

    }

  };
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const data = await sendMessage({
        sender: currentUser.id,
        receiver: selectedUser._id,
        text: newMessage,
      });

      setMessages((prev) => [...prev, data.data]);

      socket.emit("send_message", data.data);

      // Stop typing after sending message
      socket.emit("stop_typing", {
        receiver: selectedUser._id,
      });

      setNewMessage("");

    } catch (error) {
      console.error(error.message);
    }
  };

  const isSelectedUserOnline =
    selectedUser && onlineUsers.includes(selectedUser._id);
  return (


    <div className="flex h-screen bg-gray-100">
      <Sidebar
        users={users}
        onlineUsers={onlineUsers}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
      />

      {
        selectedUser ? (

          <div className="h-screen flex flex-col">

            {/* Header */}

            <div className="bg-white border-b p-4">

              <h2 className="text-xl font-semibold">
                {selectedUser.username}
              </h2>

              <p className="text-sm font-medium">
                {isTyping
                  ? "✍️ Typing..."
                  : isSelectedUserOnline
                    ? "🟢 Online"
                    : "⚫ Offline"}
              </p>
            </div>

            {/* Messages */}

            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center">
                  No messages yet
                </p>
              ) : (
                messages.map((msg) => {
                  const isSender =
                    msg.sender?.toString() === currentUser.id.toString();

                  return (
                    <div
                      key={msg._id}
                      className={`mb-3 flex ${isSender ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`px-4 py-2 rounded-lg max-w-xs ${isSender
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-900"
                          }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}

            <div className="bg-white border-t p-4 flex gap-3">

              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewMessage(value);

                  if (!selectedUser) return;

                  if (value.trim() !== "") {
                    socket.emit("typing", {
                      sender: currentUser.id,
                      receiver: selectedUser._id,
                    });
                  } else {
                    socket.emit("stop_typing", {
                      receiver: selectedUser._id,
                    });
                  }
                }}
                className="flex-1 border rounded-lg px-4 py-2 outline-none"
              />

              <button
                onClick={handleSend}
                className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700"
              >
                Send
              </button>

            </div>

          </div>

        ) : (

          <div className="h-screen flex items-center justify-center">

            <h1 className="text-3xl text-gray-400 font-semibold">

              Select a user to start chatting

            </h1>

          </div>

        )
      }

    </div>
  );
}
export default Chat;