import UserCard from "./UserCard";

function Sidebar({
  users,
  onlineUsers,
  selectedUser,
  setSelectedUser
}) {
  return (
    <div className="w-80 h-screen border-r border-gray-300 bg-white">

      {/* Header */}
      <div className="p-5 border-b">
        <h1 className="text-2xl font-bold">
          Chat App
        </h1>
      </div>

      {/* Search */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Search user..."
          className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Users */}
      <div className="px-3 space-y-2">

        {users.length > 0 ? (

          users.map((user) => (

            <UserCard
              key={user._id}
              user={user}
              onlineUsers={onlineUsers}
              selected={selectedUser?._id === user._id}
              onClick={() => setSelectedUser(user)}
            />
          ))

        ) : (

          <p className="text-center text-gray-500">
            No users found
          </p>
        )}

      </div>

    </div>
  );
}

export default Sidebar;