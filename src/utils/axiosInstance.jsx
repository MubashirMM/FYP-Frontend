import axios from "axios";
import { useNavigate } from "react-router-dom"; // We'll use it in a custom hook

const API = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API,
});

// Response Interceptor - Global error handler
axiosInstance.interceptors.response.use(
  (response) => response, // Success - do nothing
  (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Token expired or invalid credentials)
    if (error.response?.status === 401) {
      const errorDetail = error.response?.data?.detail || "";

      // Check if it's credential error or session expired
      if (
        errorDetail.includes("credential") ||
        errorDetail.includes("درست نہیں") ||
        errorDetail.toLowerCase().includes("invalid")
      ) {
        // For login failures, keep original message
        return Promise.reject(error);
      }

      // Session expired / Token invalid
      const friendlyMessage = "آپ کا سیشن ختم ہو چکا ہے۔ براہ مہربانی دوبارہ لاگ ان کریں۔";

      // Show nice toast (if you have a global toast system)
      // For simplicity, we'll alert + redirect
      alert(friendlyMessage);

      // Clear token
      localStorage.removeItem("token");

      // Redirect to login
      window.location.href = "/login"; // Force reload to clear all state

      return Promise.reject(new Error(friendlyMessage));
    }

    // Other errors (keep original backend message)
    return Promise.reject(error);
  }
);

export default axiosInstance;