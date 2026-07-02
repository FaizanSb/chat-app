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