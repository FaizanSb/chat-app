import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../services/userService";
import Sidebar from "../components/Sidebar";
import Avatar from "../components/Avatar";
import { getMessages } from "../services/messageService";
import socket from "../socket";

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
          "http://localhost:5000/api/audio",
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

  const isSelectedUserOnline =
    selectedUser &&
    onlineUsers.includes(String(selectedUser._id));

  return (
    <div className="flex h-screen bg-gray-100">
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
        <div className="flex-1 min-w-0 h-screen flex flex-col">
          {/* Chat header */}
          <div className="bg-white border-b p-4 flex items-center gap-3">
            <Avatar user={selectedUser} size="w-10 h-10" />

            <div>
              <h2 className="text-xl font-semibold">
                {selectedUser.username}
              </h2>

              <p className="text-sm font-medium">
                {isTyping
                  ? "✍️ Typing..."
                  : isSelectedUserOnline
                    ? "🟢 Online"
                    : "⚫ Offline"}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-center">
                No messages yet
              </p>
            ) : (
              messages.map((msg) => {
                const isSender =
                  String(msg.sender) === String(currentUser?.id);

                return (
                  <div
                    key={msg._id}
                    className={`mb-3 flex ${isSender ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`px-4 py-2 rounded-lg max-w-[85%] sm:max-w-xs ${isSender
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-900"
                        }`}
                    >
                      {msg.messageType === "audio" ? (
                        <audio
                          controls
                          preload="metadata"
                          src={msg.audioUrl}
                          className="max-w-full"
                        >
                          Your browser does not support audio playback.
                        </audio>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">
                          {msg.text}
                        </p>
                      )}

                      {/* Delivery/seen status */}
                      {isSender && (
                        <div className="text-xs text-right mt-1">
                          {msg.isSeen
                            ? "✓✓ Seen"
                            : msg.delivered
                              ? "✓✓ Delivered"
                              : "✓ Sent"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Single input area and single Send button */}
          <div className="bg-white border-t p-4 flex flex-col gap-3">
            {/* Recording controls */}
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={!!audioPreviewUrl || isSending}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  🎙️ Record
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900"
                >
                  ⏹ Stop Recording
                </button>
              )}

              {isRecording && (
                <span className="text-red-600 font-medium">
                  ● Recording...
                </span>
              )}
            </div>

            {/* Audio preview */}
            {audioPreviewUrl && (
              <div className="flex flex-wrap items-center gap-3">
                <audio
                  controls
                  src={audioPreviewUrl}
                  className="max-w-full"
                />

                <button
                  type="button"
                  onClick={handleCancelRecording}
                  disabled={isSending}
                  className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>

                <span className="text-sm text-gray-500">
                  Ready to send
                </span>
              </div>
            )}

            {audioError && (
              <p className="text-sm text-red-600">
                {audioError}
              </p>
            )}

            {/* Text input + ONE Send button */}
            <form
              className="flex gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                placeholder={
                  audioBlob
                    ? "Audio ready — press Send"
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
                className="flex-1 min-w-0 border rounded-lg px-4 py-2 outline-none disabled:bg-gray-100"
              />

              <button
                type="submit"
                disabled={
                  isSending ||
                  isRecording ||
                  (!audioBlob && !newMessage.trim())
                }
                className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSending
                  ? "Sending..."
                  : audioBlob
                    ? "Send Voice"
                    : "Send"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 h-screen flex items-center justify-center">
          <h1 className="text-3xl text-gray-400 font-semibold text-center">
            Select a user to start chatting
          </h1>
        </div>
      )}
    </div>
  );
}

export default Chat;