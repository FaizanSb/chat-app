import Avatar from "./Avatar";
function UserCard({
  user,
  onlineUsers = [],
  selected,
  onClick,
}) {
  const isOnline = onlineUsers.some(
    (id) => String(id) === String(user._id)
  );

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${selected ? "bg-blue-100" : "hover:bg-gray-100"
        }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        
        <Avatar user={user} size="w-12 h-12" text="text-lg" />

        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
        />
      </div>

      {/* User details */}
      <div className="min-w-0">
        <h3 className="font-semibold truncate">{user.username}</h3>

        <p className="text-sm text-gray-500 truncate">
          {user.lastMessage || "No messages yet"}
        </p>
      </div>
    </div>
  );
}

export default UserCard;