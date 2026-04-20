import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API,
});

// ✅ ADD THIS - Request Interceptor to add token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Global error handler
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      const errorDetail = error.response?.data?.detail || "";

      if (
        errorDetail.includes("credential") ||
        errorDetail.includes("درست نہیں") ||
        errorDetail.toLowerCase().includes("invalid")
      ) {
        return Promise.reject(error);
      }

      const friendlyMessage = "آپ کا سیشن ختم ہو چکا ہے۔ براہ مہربانی دوبارہ لاگ ان کریں۔";
      alert(friendlyMessage);
      localStorage.removeItem("token");
      window.location.href = "/login";

      return Promise.reject(new Error(friendlyMessage));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;