const bcrypt = require("bcrypt");
const User = require("../models/user");
const generateToken = require("../utils/generateToken");
const Message = require("../models/Message");
exports.registerUser = async (req, res) => {
    try {
        // Get data from request body
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields."
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        // Success response
        return res.status(201).json({
            success: true,
            message: "User registered successfully!",
            user: newUser
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

exports.loginUser = async (req, res) => {
    try {
        // Get data from request body
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields."
            });
        }

        // Check if user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found."
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        // Success response
        return res.status(200).json({
            success: true,
            message: "User logged in successfully!",
            token: generateToken(user._id),
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Get all other users for the chat sidebar
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

// Get the currently logged-in user's profile
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

// Update the currently logged-in user's username
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