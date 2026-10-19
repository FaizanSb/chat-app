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

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 2 || trimmedUsername.length > 30) {
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
    <div
      className={`h-[100dvh] w-full shrink-0 flex-col border-slate-200 bg-white md:flex md:w-72 md:border-r lg:w-80 ${
        selectedUser ? "hidden" : "flex"
      }`}
    >
      {/* App header */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-teal-400 shadow-lg shadow-slate-900/10">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
          </svg>
        </span>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight tracking-tight text-slate-900">
            Chat App
          </h1>
          <p className="text-xs text-slate-500">
            {(users || []).length} contacts
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            type="text"
            placeholder="Search user..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
          />
        </div>
      </div>

      {/* Other users (scrollable) */}
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
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
          <p className="mt-10 text-center text-sm text-slate-500">
            No users found
          </p>
        )}
      </div>

      {/* Profile card (fixed at bottom) */}
      <div className="shrink-0 border-t border-slate-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handleOpenProfile}
          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
        >
          <div className="relative shrink-0">
            <Avatar user={currentUser} size="w-11 h-11" text="text-lg" />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-50 bg-emerald-500" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {currentUser?.username || "My Profile"}
            </p>
            <p className="text-xs text-slate-500">View profile</p>
          </div>

          <svg
            className="h-4 w-4 shrink-0 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>

      {/* Profile modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Banner + avatar (avatar banner ke edge pr, hamesha upar) */}
            <div className="relative mb-14">
              <div className="relative h-28 overflow-hidden bg-slate-900">
                <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-teal-500/20 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-12 right-0 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl" />

                <h2 className="absolute left-4 top-5 text-sm font-semibold tracking-wide text-white sm:left-6">
                  My Profile
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    clearSelectedFile();
                    setShowProfile(false);
                  }}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200/30 sm:right-4"
                  aria-label="Close profile"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              {/* Avatar: banner ke neechy wale edge ke center me */}
              {!loading && (
                <div className="absolute left-1/2 top-full z-20 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative rounded-full bg-white shadow-md ring-4 ring-white">
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
                          onClick={() => fileInputRef.current?.click()}
                          aria-label="Change photo"
                          className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white ring-2 ring-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" />
                            <circle cx="12" cy="13" r="3.5" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 pb-6 sm:px-6">
              {loading ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Loading profile...
                </p>
              ) : (
                <>
                  {/* Username + email/hint */}
                  <div className="mb-6 flex flex-col items-center text-center">
                    <p className="max-w-full break-words text-xl font-semibold tracking-tight text-slate-900">
                      {profile?.username}
                    </p>

                    {isEditing ? (
                      <p className="mt-1 text-xs text-slate-500">
                        JPG or PNG, max 2MB
                      </p>
                    ) : (
                      <p className="mt-1 max-w-full break-all text-sm text-slate-500">
                        {profile?.email}
                      </p>
                    )}
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
                    >
                      {error}
                    </p>
                  )}

                  {success && (
                    <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                      {success}
                    </p>
                  )}

                  {isEditing ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div>
                        <label
                          htmlFor="profileUsername"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
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
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Email
                        </label>
                        <p className="break-all rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500">
                          {profile?.email}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Email cannot be changed here.
                        </p>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="h-11 flex-1 rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="h-11 flex-1 rounded-xl bg-slate-100 text-sm font-medium text-slate-700 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          setUsername(profile?.username || "");
                          setIsEditing(true);
                          setError("");
                          setSuccess("");
                        }}
                        className="h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200 active:scale-[0.98]"
                      >
                        Edit Profile
                      </button>

                      <button
                        type="button"
                        onClick={onLogout}
                        className="h-11 w-full rounded-xl border border-red-200 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;