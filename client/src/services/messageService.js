import axiosInstance from "../utils/axios";

// Send Message
export const sendMessage = async (messageData) => {
  try {
    const response = await axiosInstance.post(
      "/messages",
      messageData
    );

    return response.data;

  } catch (error) {

    const message =
      error.response?.data?.message || "Failed to send message.";

    throw new Error(message);

  }
};

// Get Conversation
export const getMessages = async (senderId, receiverId) => {

  try {

    const response = await axiosInstance.get(
      `/messages/${senderId}/${receiverId}`
    );

    return response.data;

  } catch (error) {

    const message =
      error.response?.data?.message || "Failed to fetch messages.";

    throw new Error(message);

  }

};