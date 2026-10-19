import { useEffect, useState, useRef } from "react";
import UserCard from "./UserCard";
import {
  getMyProfile,
  updateMyProfile,
} from "../services/userService";
import Avatar from "./Avatar";

function Sidebar({
  users,
  onlineUsers,
  selectedUser,
  setSelectedUser,
  currentUser,
  onProfileUpdated,
  onLogout,
}) {
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(currentUser);
  const [username, setUsername] = useState(
    currentUser?.username || ""
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    setProfile(currentUser);
    setUsername(currentUser?.username || "");
  }, [currentUser]);

  const filteredUsers = (users || []).filter((user) =>
    (user.username || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleOpenProfile = async () => {
    setShowProfile(true);
    setIsEditing(false);
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await getMyProfile();

      setProfile(data.user);
      setUsername(data.user.username);
      onProfileUpdated(data.user);
    } catch (err) {
      console.error("Fetch profile error:", err);
      setError(
        err.response?.data?.message ||
        "Could not load profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 2 ||
      trimmedUsername.length > 30) {
      setError("Username must be between 2 and 30 characters.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await updateMyProfile(trimmedUsername, selectedFile);

      setProfile(data.user);
      setUsername(data.user.username);

      // Update Chat state and localStorage
      onProfileUpdated(data.user);

      setIsEditing(false);
      clearSelectedFile();
      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Update profile error:", err);
      setError(
        err.response?.data?.message ||
        "Could not update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB.");
      return;
    }

    setError("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCancelEdit = () => {
    setUsername(profile?.username || "");
    clearSelectedFile();
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  return (
    <div className="w-80 max-w-full h-screen shrink-0 border-r border-gray-300 bg-white flex flex-col">
      {/* App header */}
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Chat App</h1>
      </div>

      {/* Search */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Search user..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Other users (scrollable) */}
      <div className="px-3 pb-4 space-y-2 overflow-y-auto flex-1">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
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

      {/* Profile card (fixed at bottom) */}
      <div className="p-4 border-t shrink-0">
        <button
          type="button"
          onClick={handleOpenProfile}
          className="w-full flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-gray-50"
        >
          <Avatar user={currentUser} size="w-11 h-11" text="text-lg" />

          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">
              {currentUser?.username || "My Profile"}
            </p>
            <p className="text-sm text-gray-500">View profile</p>
          </div>

          <span className="text-gray-500">›</span>
        </button>
      </div>

      {/* Profile modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">My Profile</h2>

              <button
                type="button"
                onClick={() => {
                  clearSelectedFile();
                  setShowProfile(false);
                }}
                className="text-2xl text-gray-500 hover:text-gray-800"
                aria-label="Close profile"
              >
                ×
              </button>
            </div>

            {loading ? (
              <p className="text-gray-500">Loading profile...</p>
            ) : (
              <>
                <div className="flex flex-col items-center mb-6">
                  <Avatar
                    user={{
                      ...profile,
                      profilePicture:
                        previewUrl || profile?.profilePicture,
                    }}
                    size="w-24 h-24"
                    text="text-4xl"
                  />

                  {isEditing && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="mt-3 text-sm text-blue-600 hover:underline"
                      >
                        Change photo
                      </button>
                    </>
                  )}

                  <p className="mt-3 font-semibold text-lg">
                    {profile?.username}
                  </p>
                </div>

                {error && (
                  <p className="mb-3 text-sm text-red-600">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="mb-3 text-sm text-green-600">
                    {success}
                  </p>
                )}

                {isEditing ? (
                  <form
                    onSubmit={handleSaveProfile}
                    className="space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="profileUsername"
                        className="block text-sm font-medium mb-1"
                      >
                        Username
                      </label>

                      <input
                        id="profileUsername"
                        type="text"
                        value={username}
                        onChange={(event) =>
                          setUsername(event.target.value)
                        }
                        minLength={2}
                        maxLength={30}
                        required
                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <p className="w-full bg-gray-100 rounded-lg px-3 py-2 text-gray-600 break-all">
                        {profile?.email}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Email editing is not included in this feature.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex-1 bg-gray-200 rounded-lg px-4 py-2 hover:bg-gray-300 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Username
                        </p>
                        <p className="font-medium break-words">
                          {profile?.username}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          Email
                        </p>
                        <p className="font-medium break-all">
                          {profile?.email}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUsername(profile?.username || "");
                        setIsEditing(true);
                        setError("");
                        setSuccess("");
                      }}
                      className="mt-6 w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
                    >
                      Edit Profile
                    </button>

                    <button
                      type="button"
                      onClick={onLogout}
                      className="mt-3 w-full bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600"
                    >
                      Log out
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;