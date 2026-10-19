import Avatar from "./Avatar";

function UserCard({ user, onlineUsers = [], selected, onClick }) {
  const isOnline = onlineUsers.some(
    (id) => String(id) === String(user._id)
  );

  return (
    <div
      onClick={onClick}
      className={`relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${
        selected
          ? "bg-slate-100 ring-1 ring-slate-200"
          : "hover:bg-slate-50"
      }`}
    >
      {/* Selected indicator */}
      {selected && (
        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-teal-500" />
      )}

      {/* Avatar + online dot */}
      <div className="relative shrink-0">
        <Avatar user={user} size="w-12 h-12" text="text-lg" />

        <span
          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
            isOnline ? "bg-emerald-500" : "bg-slate-300"
          }`}
        />
      </div>

      {/* User details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {user.username}
          </h3>
          {isOnline && (
            <span className="shrink-0 text-[10px] font-medium text-teal-600">
              Online
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-xs text-slate-500">
          {user.lastMessage || "No messages yet"}
        </p>
      </div>
    </div>
  );
}

export default UserCard;