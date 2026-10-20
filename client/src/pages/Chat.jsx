import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../services/userService";
import Sidebar from "../components/Sidebar";
import Avatar from "../components/Avatar";
import { getMessages } from "../services/messageService";
import socket from "../socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ---------- Small inline icons (no extra library needed) ----------
const iconProps = {
  className: "h-5 w-5",
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const MicIcon = () => (
  <svg {...iconProps}>
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

const StopIcon = () => (
  <svg {...iconProps} fill="currentColor" stroke="none">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const SendIcon = () => (
  <svg {...iconProps}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
  </svg>
);

const CloseIcon = () => (
  <svg {...iconProps}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const BackIcon = () => (
  <svg {...iconProps}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg {...iconProps} className="h-8 w-8">
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
  </svg>
);

const CheckIcon = ({ double }) => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {double ? (
      <>
        <path d="m2 13 4 4L14 8" />
        <path d="m10 15 2 2 9-10" />
      </>
    ) : (
      <path d="m5 13 4 4L19 7" />
    )}
  </svg>
);

// Message status: Sent / Delivered / Seen
const MessageStatus = ({ msg }) => {
  if (msg.isSeen) {
    return (
      <span className="inline-flex items-center gap-1 text-teal-300">
        <CheckIcon double /> Seen
      </span>
    );
  }
  if (msg.delivered) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-400">
        <CheckIcon double /> Delivered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-slate-400">
      <CheckIcon /> Sent
    </span>
  );
};

function Chat() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // Audio states
  const [isRecording, setIsRecording] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioError, setAudioError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const typingTimeout = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data.users || []);
      } catch (error) {
        console.error("Fetch users error:", error);
      }
    };

    fetchUsers();
  }, []);

  // Join Socket.IO room/presence
  useEffect(() => {
    if (!currentUser?.id) return;

    const joinSocket = () => {
      socket.emit("join", currentUser.id);
    };

    socket.on("connect", joinSocket);

    // Logout ke baad dobara login par socket reconnect ho
    if (!socket.connected) {
      socket.connect();
    }

    if (socket.connected) {
      joinSocket();
    }

    return () => {
      socket.off("connect", joinSocket);
    };
  }, [currentUser?.id]);

  // Online users
  useEffect(() => {
    const handleOnlineUsers = (onlineUserIds) => {
      setOnlineUsers(onlineUserIds);
    };

    socket.on("online_users", handleOnlineUsers);

    return () => {
      socket.off("online_users", handleOnlineUsers);
    };
  }, []);

  // Load messages for selected user
  useEffect(() => {
    if (!selectedUser || !currentUser?.id) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      try {
        const data = await getMessages(
          currentUser.id,
          selectedUser._id
        );

        if (cancelled) return;

        setMessages(data.messages || []);

        (data.messages || []).forEach((msg) => {
          const shouldMarkSeen =
            String(msg.receiver) === String(currentUser.id) &&
            String(msg.sender) === String(selectedUser._id) &&
            !msg.isSeen;

          if (shouldMarkSeen) {
            socket.emit("message_seen", {
              messageId: msg._id,
              senderId: msg.sender,
            });
          }
        });
      } catch (error) {
        console.error("Fetch messages error:", error);
      }
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedUser?._id, currentUser?.id]);

  // Receive text and audio messages
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      const isCurrentChat =
        selectedUser &&
        (
          (
            String(message.sender) === String(selectedUser._id) &&
            String(message.receiver) === String(currentUser?.id)
          ) ||
          (
            String(message.sender) === String(currentUser?.id) &&
            String(message.receiver) === String(selectedUser._id)
          )
        );

      if (isCurrentChat) {
        setMessages((previous) => {
          // Prevent adding the same message twice
          const alreadyExists = previous.some(
            (msg) => String(msg._id) === String(message._id)
          );

          if (alreadyExists) return previous;

          return [...previous, message];
        });
      }

      // Automatically mark incoming messages as seen
      if (
        selectedUser &&
        String(message.sender) === String(selectedUser._id) &&
        String(message.receiver) === String(currentUser?.id)
      ) {
        socket.emit("message_seen", {
          messageId: message._id,
          senderId: message.sender,
        });
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [selectedUser?._id, currentUser?.id]);

  // Delivered status
  useEffect(() => {
    const handleDelivered = (messageId) => {
      setMessages((previous) =>
        previous.map((msg) =>
          String(msg._id) === String(messageId)
            ? { ...msg, delivered: true }
            : msg
        )
      );
    };

    socket.on("message_delivered", handleDelivered);

    return () => {
      socket.off("message_delivered", handleDelivered);
    };
  }, []);

  // Seen status
  useEffect(() => {
    const handleSeen = (messageId) => {
      setMessages((previous) =>
        previous.map((msg) =>
          String(msg._id) === String(messageId)
            ? { ...msg, isSeen: true }
            : msg
        )
      );
    };

    socket.on("message_seen", handleSeen);

    return () => {
      socket.off("message_seen", handleSeen);
    };
  }, []);

  // Typing indicator
  useEffect(() => {
    const handleTyping = ({ sender }) => {
      if (String(sender) !== String(selectedUser?._id)) return;

      setIsTyping(true);
      clearTimeout(typingTimeout.current);

      typingTimeout.current = setTimeout(() => {
        setIsTyping(false);
      }, 1500);
    };

    const handleStopTyping = () => {
      setIsTyping(false);
      clearTimeout(typingTimeout.current);
    };

    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);

    return () => {
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
      clearTimeout(typingTimeout.current);
    };
  }, [selectedUser?._id]);

  // Naya message aane par neeche tak scroll karo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser?._id]);

  // Start audio recording
  const handleStartRecording = async () => {
    try {
      setAudioError("");
      setAudioBlob(null);
      setAudioPreviewUrl(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Audio recording requires a supported browser and secure connection."
        );
      }

      if (typeof MediaRecorder === "undefined") {
        throw new Error("Audio recording is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setAudioError("Recording failed. Please try again.");
      };

      recorder.onstop = () => {
        const chunks = audioChunksRef.current;
        const mimeType =
          recorder.mimeType || chunks[0]?.type || "audio/webm";

        const blob = new Blob(chunks, { type: mimeType });

        if (blob.size > 0) {
          setAudioBlob(blob);
          setAudioPreviewUrl(URL.createObjectURL(blob));
        } else {
          setAudioError("No audio was recorded. Please try again.");
        }

        audioChunksRef.current = [];

        stream.getTracks().forEach((track) => track.stop());

        audioStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Recording error:", error);

      setAudioError(
        error.message || "Microphone access failed."
      );

      audioStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      audioStreamRef.current = null;
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  // Cancel audio preview
  const handleCancelRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }

    audioStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    audioStreamRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];

    setIsRecording(false);
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setAudioError("");
  };

  // Clean up microphone when component unmounts
  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }

      audioStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, []);

  // Release preview URL
  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  // ONE SEND BUTTON: sends audio if a recording is ready,
  // otherwise sends the typed text message.
  const handleSend = async () => {
    if (isSending || isRecording || !selectedUser) return;

    if (!socket.connected) {
      setAudioError("Chat server is disconnected. Please try again.");
      return;
    }

    // Send audio when preview exists
    if (audioBlob) {
      try {
        setIsSending(true);
        setAudioError("");

        const formData = new FormData();
        formData.append("audio", audioBlob, "voice-message.webm");

        const response = await fetch(
          `${API_URL}/api/audio`,
          {
            method: "POST",
            body: formData,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Audio upload failed."
          );
        }

        if (!result.audioUrl) {
          throw new Error("The server did not return an audio URL.");
        }

        socket.emit("send_message", {
          sender: currentUser.id,
          receiver: selectedUser._id,
          messageType: "audio",
          audioUrl: result.audioUrl,
        });

        handleCancelRecording();
      } catch (error) {
        console.error("Audio send error:", error);
        setAudioError(
          error.message || "Could not send audio message."
        );
      } finally {
        setIsSending(false);
      }

      return;
    }

    // Otherwise send text
    if (!newMessage.trim()) return;

    socket.emit("send_message", {
      sender: currentUser.id,
      receiver: selectedUser._id,
      messageType: "text",
      text: newMessage.trim(),
    });

    setNewMessage("");
    socket.emit("stop_typing", {
      receiver: selectedUser._id,
    });
  };

  const handleProfileUpdated = (updatedUser) => {
    const updatedCurrentUser = {
      ...currentUser,
      ...updatedUser,
    };

    localStorage.setItem(
      "user",
      JSON.stringify(updatedCurrentUser)
    );

    setCurrentUser(updatedCurrentUser);

    // Update the selected user's name if applicable
    setUsers((previousUsers) =>
      previousUsers.map((user) =>
        String(user._id) === String(updatedUser.id || updatedUser._id)
          ? { ...user, username: updatedUser.username }
          : user
      )
    );

    setSelectedUser((previousSelectedUser) => {
      if (
        previousSelectedUser &&
        String(previousSelectedUser._id) ===
        String(updatedUser.id || updatedUser._id)
      ) {
        return {
          ...previousSelectedUser,
          username: updatedUser.username,
        };
      }

      return previousSelectedUser;
    });
  };

  const handleLogout = () => {
    socket.disconnect(); // server ko offline ka pata chal jaye ga
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Mobile: chat se wapas user list pr
  const handleBack = () => {
    handleCancelRecording();
    setIsTyping(false);
    setSelectedUser(null);
  };

  const isSelectedUserOnline =
    selectedUser &&
    onlineUsers.includes(String(selectedUser._id));

  const canSend =
    !isSending && !isRecording && (audioBlob || newMessage.trim());

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-100">
      <Sidebar
        users={users}
        onlineUsers={onlineUsers}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        currentUser={currentUser}
        onProfileUpdated={handleProfileUpdated}
        onLogout={handleLogout}
      />

      {selectedUser ? (
        <div className="flex h-[100dvh] min-w-0 flex-1 flex-col">
          {/* Chat header */}
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-3 sm:gap-3 sm:px-5">
            {/* Back button: sirf mobile pr */}
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back to chats"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 md:hidden"
            >
              <BackIcon />
            </button>

            <Avatar user={selectedUser} size="w-10 h-10 sm:w-11 sm:h-11" />

            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-slate-900">
                {selectedUser.username}
              </h2>

              {isTyping ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-teal-600">
                  typing
                  <span className="flex items-center gap-0.5">
                    <span className="h-1 w-1 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.3s]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.15s]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-teal-500" />
                  </span>
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-sm text-slate-500">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isSelectedUserOnline ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                  {isSelectedUserOnline ? "Online" : "Offline"}
                </p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 py-4 sm:px-6 sm:py-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ChatBubbleIcon />
                </span>
                <p className="mt-4 text-sm font-medium text-slate-700">
                  No messages yet
                </p>
                <p className="mt-1 break-words text-sm text-slate-500">
                  Say hi to {selectedUser.username} to start the conversation.
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-3">
                {messages.map((msg) => {
                  const isSender =
                    String(msg.sender) === String(currentUser?.id);

                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 sm:max-w-md ${
                          isSender
                            ? "rounded-2xl rounded-br-sm bg-black text-white shadow-sm"
                            : "rounded-2xl rounded-bl-sm border border-slate-200 bg-yellow-200 text-slate-800 shadow-sm"
                        }`}
                      >
                        {msg.messageType === "audio" ? (
                          <audio
                            controls
                            preload="metadata"
                            src={msg.audioUrl}
                            className="h-10 w-full min-w-[12rem] max-w-full sm:w-60"
                          >
                            Your browser does not support audio playback.
                          </audio>
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {msg.text}
                          </p>
                        )}

                        {/* Delivery/seen status */}
                        {isSender && (
                          <div className="mt-1 flex justify-end text-[11px]">
                            <MessageStatus msg={msg} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-slate-200 bg-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-3xl space-y-3">
              {/* Recording indicator */}
              {isRecording && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                  <span className="text-sm font-medium text-red-700">
                    Recording... tap stop when you're done
                  </span>
                </div>
              )}

              {/* Audio preview */}
              {audioPreviewUrl && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
                  <audio
                    controls
                    src={audioPreviewUrl}
                    className="h-10 w-full max-w-full sm:w-60"
                  />

                  <span className="text-sm text-slate-500">
                    Ready to send
                  </span>

                  <button
                    type="button"
                    onClick={handleCancelRecording}
                    disabled={isSending}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50"
                  >
                    <CloseIcon />
                    Discard
                  </button>
                </div>
              )}

              {audioError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {audioError}
                </p>
              )}

              {/* Text input + record + ONE Send button */}
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
              >
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={!!audioPreviewUrl || isSending}
                    aria-label="Record voice message"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MicIcon />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    aria-label="Stop recording"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white transition hover:bg-red-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
                  >
                    <StopIcon />
                  </button>
                )}

                <input
                  type="text"
                  placeholder={
                    audioBlob
                      ? "Voice message ready. Press send."
                      : "Type a message..."
                  }
                  value={newMessage}
                  disabled={!!audioBlob || isRecording || isSending}
                  onChange={(event) => {
                    const value = event.target.value;
                    setNewMessage(value);

                    if (!selectedUser) return;

                    if (value.trim()) {
                      socket.emit("typing", {
                        sender: currentUser.id,
                        receiver: selectedUser._id,
                      });
                    } else {
                      socket.emit("stop_typing", {
                        receiver: selectedUser._id,
                      });
                    }
                  }}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                />

                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send message"
                  className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
                >
                  {isSending ? (
                    "Sending..."
                  ) : (
                    <>
                      <span className="hidden sm:inline">
                        {audioBlob ? "Send voice" : "Send"}
                      </span>
                      <SendIcon />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state: mobile pr hidden (wahan sirf user list dikhti ha) */
        <div className="relative hidden h-[100dvh] flex-1 items-center justify-center overflow-hidden bg-slate-50 px-6 md:flex">
          <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-teal-400 shadow-xl shadow-slate-900/10">
              <ChatBubbleIcon />
            </span>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
              Pick a conversation
            </h1>
            <p className="mt-2 max-w-xs text-sm text-slate-500">
              Choose someone from the list to read your messages or start a new chat.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;