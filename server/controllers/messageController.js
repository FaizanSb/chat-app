const Message = require("../models/Message");
const sendMessage = async (req, res) => {

    try {

        const { sender, receiver, text } = req.body;

        const newMessage = new Message({
            sender,
            receiver,
            text,
        });

        await newMessage.save();

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: newMessage,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};

const getMessages = async (req, res) => {

    try {

        const { senderId, receiverId } = req.params;

        const messages = await Message.find({
            $or: [
                {
                    sender: senderId,
                    receiver: receiverId,
                },
                {
                    sender: receiverId,
                    receiver: senderId,
                },
            ],
        }).sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            messages,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};

module.exports = {
    sendMessage,
    getMessages,
};