const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Avatar({ user, size = "w-10 h-10", text = "text-base" }) {
  const pic = user?.profilePicture;

  if (pic) {
    const src =
      pic.startsWith("http") || pic.startsWith("blob:")
        ? pic
        : `${SERVER_URL}${pic}`;

    return (
      <img
        src={src}
        alt={user?.username || "avatar"}
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${size} ${text} flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 font-semibold text-white`}
    >
      {(user?.username || "?").charAt(0).toUpperCase()}
    </div>
  );
}

export default Avatar;