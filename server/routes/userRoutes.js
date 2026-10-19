
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const uploadProfile = require("../middleware/uploadProfile");

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
router.put(
  "/profile",
  protect,
  (req, res, next) => {
    uploadProfile.single("profilePicture")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  updateMyProfile
);

module.exports = router;


