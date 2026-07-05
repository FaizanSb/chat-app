function UserCard({
  user,
  onlineUsers,
  selected,
  onClick,
}) {

  console.log("onlineUsers:", onlineUsers);
  console.log("Type:", typeof onlineUsers);
  console.log("Is Array:", Array.isArray(onlineUsers));

  const isOnline = onlineUsers.includes(user._id);

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${selected ? "bg-blue-100" : "hover:bg-gray-100"
        }`}
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
          {user.username.charAt(0).toUpperCase()}
        </div>

        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
        ></span>
      </div>

      <div>
        <h3 className="font-semibold">{user.username}</h3>

        <p className="text-sm text-gray-500 truncate">
          {user.lastMessage}
        </p>
      </div>
    </div>
  );
}

export default UserCard;