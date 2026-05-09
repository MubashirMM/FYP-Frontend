import axios from 'axios';

// Get API URL from environment
const API = import.meta.env.VITE_API_URL;

// Set base URL
axios.defaults.baseURL = API;

// Add token to every request automatically
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Handle 401 responses globally
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || "";
    const token = localStorage.getItem('token');
    const isAuthEndpoint = [
      "/auth/login",
      "/auth/register",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/reset-password-confirm",
    ].some((path) => requestUrl.includes(path));

    if (error.response?.status === 401 && token && !isAuthEndpoint) {
      // Only redirect to login when the user already had a token and it is no longer valid.
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default axios;