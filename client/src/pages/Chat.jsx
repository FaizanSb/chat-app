import { useEffect, useState } from "react";
import { getUsers } from "../services/userService";
import Loader from "../components/Loader";
import Sidebar from "../components/Sidebar";
import UserCard from "../components/UserCard";

function Chat() {

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {

    fetchUsers();

  }, []);

  const fetchUsers = async () => {

    try {

      const data = await getUsers();

      console.log(data);

      setUsers(data.users);

    } catch (error) {

      console.error(error.message);

    }

  };

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: "me",
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (


    <div className="flex h-screen bg-gray-100">
      <Sidebar
        users={users}
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

              <p className="text-sm text-gray-500">
                {selectedUser.status}
              </p>

            </div>

            {/* Messages */}

            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center">
                  No messages yet
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-3 flex ${msg.sender === "me" ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-xs">
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Message Input */}

            <div className="bg-white border-t p-4 flex gap-3">

              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
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