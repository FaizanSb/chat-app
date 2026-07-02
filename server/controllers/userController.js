const User = require("../models/user");

exports.getUsers = async (req, res) => {
    try {

        // Logged in user ki id middleware se milegi
        const currentUserId = req.user.id;

        // Current user ko exclude karo
        const users = await User.find({
            _id: { $ne: currentUserId }
        }).select("-password");

        return res.status(200).json({
            success: true,
            users
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};