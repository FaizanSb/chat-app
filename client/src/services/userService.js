// src/services/userService.js

import axiosInstance from "../utils/axios";

export const getUsers = async () => {
    try {
        const response = await axiosInstance.get("/users");
        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message || "Failed to fetch users.";

        throw new Error(message);
    }
};

// Keep your existing getUsers function.
// Add these two functions at the bottom of userService.js:

export const getMyProfile = async () => {
  const response = await axiosInstance.get("/users/profile");
  return response.data;
};

export const updateMyProfile = async (username, file) => {
  const formData = new FormData();
  formData.append("username", username);
  if (file) formData.append("profilePicture", file);

  const response = await axiosInstance.put("/users/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};