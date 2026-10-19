const SERVER_URL = "http://localhost:5000";

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
        className={`${size} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${size} ${text} rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0`}
    >
      {(user?.username || "?").charAt(0).toUpperCase()}
    </div>
  );
}

export default Avatar;