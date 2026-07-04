const User = require("../models/user");
const Message = require("../models/Message");
exports.getUsers = async (req, res) => {

    try {

        const currentUserId = req.user.id;

        const users = await User.find({
            _id: { $ne: currentUserId }
        }).select("-password");

        console.log("Selected User is ", users);

        console.log("Current User:", currentUserId);
        // console.log("Other User:", user._id);

        const messages = await Message.find();

        messages.forEach((msg) => {
            console.log({
                sender: msg.sender.toString(),
                receiver: msg.receiver.toString(),
                text: msg.text,
            });
        });

        // console.log("Current User:", currentUserId);
        // console.log("Users:", users.map((u) => ({
        //     id: u._id.toString(),
        //     username: u.username,
        // })));

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

                // console.log("Last Message is ", lastMessage);

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

        console.log(error);

        res.status(500).json({

            success: false,

            message: "Internal Server Error",

        });

    }

};