
const User = require("../models/user");
const Message = require("../models/Message");

// 1. Get all other users for the chat sidebar
exports.getUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const users = await User.find({
      _id: { $ne: currentUserId },
    }).select("-password");

    const updatedUsers = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            {
              sender: currentUserId,
              receiver: user._id,
            },
            {
              sender: user._id,
              receiver: currentUserId,
            },
          ],
        }).sort({ createdAt: -1 });

        return {
          ...user.toObject(),
          lastMessage: lastMessage
            ? lastMessage.text
            : "No messages yet",
        };
      })
    );

    return res.status(200).json({
      success: true,
      users: updatedUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// 2. Get the logged-in user's profile
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile",
    });
  }
};

// 3. Update the logged-in user's username
exports.updateMyProfile = async (req, res) => {
  try {
    const username =
      typeof req.body.username === "string"
        ? req.body.username.trim()
        : "";

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    if (username.length < 2 || username.length > 30) {
      return res.status(400).json({
        success: false,
        message: "Username must be between 2 and 30 characters",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Username updated successfully",
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};
