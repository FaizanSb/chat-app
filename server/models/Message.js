
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    messageType: {
      type: String,
      enum: ["text", "audio"],
      default: "text",
      required: true,
    },

    text: {
      type: String,
      trim: true,
      default: "",
    },

    audioUrl: {
      type: String,
      default: null,
    },

    delivered: {
      type: Boolean,
      default: false,
    },

    isSeen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.pre("validate", function () {
  if (this.messageType === "text" && !this.text?.trim()) {
    this.invalidate("text", "Text message cannot be empty.");
  }

  if (this.messageType === "audio" && !this.audioUrl) {
    this.invalidate("audioUrl", "Audio URL is required.");
  }
});

module.exports = mongoose.model("Message", messageSchema);
