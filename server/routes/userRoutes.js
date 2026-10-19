
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getUsers,
  getMyProfile,
  updateMyProfile,
} = require("../controllers/userController");

// Get other users for chat
router.get("/", protect, getUsers);

// View own profile
router.get("/profile", protect, getMyProfile);

// Update own profile
router.put("/profile", protect, updateMyProfile);

module.exports = router;
