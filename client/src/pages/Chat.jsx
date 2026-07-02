import { useEffect, useState } from "react";
import { getUsers } from "../services/userService";
import Loader from "../components/Loader";
import Sidebar from "../components/Sidebar";
import UserCard from "../components/UserCard";

function Chat() {

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

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

            <div className="flex-1 flex items-center justify-center">

              <p className="text-gray-400">
                No messages yet
              </p>

            </div>

            {/* Message Input */}

            <div className="bg-white border-t p-4 flex gap-3">

              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 border rounded-lg px-4 py-2 outline-none"
              />

              <button
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