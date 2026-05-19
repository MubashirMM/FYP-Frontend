import axios from 'axios';

// Get API URL from environment
const API = import.meta.env.VITE_API_URL;

// Set base URL
axios.defaults.baseURL = API;

// Create and inject custom alert styles
const injectAlertStyles = () => {
  if (document.getElementById('custom-alert-styles')) return;

  const style = document.createElement('style');
  style.id = 'custom-alert-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap');
    
    @font-face {
      font-family: 'Noori Nastaleeq';
      src: local('Noori Nastaleeq'),
           local('NooriNastaleeq'),
           url('/fonts/Noori-Nastaleeq.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    
    .custom-alert-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease;
    }
    
    .custom-alert {
      background: white;
      border-radius: 12px;
      padding: 24px;
      min-width: 300px;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.3s ease;
      direction: rtl;
    }
    
    .custom-alert-icon {
      text-align: center;
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .custom-alert-message {
      color: #333;
      font-size: 18px;
      line-height: 1.8;
      text-align: center;
      margin-bottom: 24px;
      word-wrap: break-word;
      font-family: 'Noto Nastaliq Urdu', 'Noori Nastaleeq', 'Jameel Noori Nastaleeq', serif;
      font-weight: 500;
    }
    
    .custom-alert-button {
      width: 100%;
      padding: 10px 20px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
      font-family: 'Noto Nastaliq Urdu', 'Noori Nastaleeq', 'Jameel Noori Nastaleeq', serif;
    }
    
    .custom-alert-button:hover {
      background: #b91c1c;
    }
    
    .custom-alert-button:active {
      transform: scale(0.98);
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
};

// Custom alert function
const showCustomAlert = (message, onClose) => {
  injectAlertStyles();

  const overlay = document.createElement('div');
  overlay.className = 'custom-alert-overlay';

  const alertBox = document.createElement('div');
  alertBox.className = 'custom-alert';
  alertBox.innerHTML = `
    <div class="custom-alert-icon">
      ⚠️
    </div>
    <div class="custom-alert-message">
      ${message}
    </div>
    <button class="custom-alert-button" id="custom-alert-ok-btn">
      ٹھیک ہے
    </button>
  `;

  overlay.appendChild(alertBox);
  document.body.appendChild(overlay);

  const closeAlert = () => {
    overlay.style.animation = 'fadeIn 0.3s ease reverse';
    setTimeout(() => {
      overlay.remove();
      if (onClose) onClose();
    }, 300);
  };

  const okButton = alertBox.querySelector('#custom-alert-ok-btn');
  okButton.addEventListener('click', closeAlert);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAlert();
  });
};

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

// Handle 401 responses globally
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
      "/auth/voice-login",
      "/auth/save-voice-samples",
    ].some((path) => requestUrl.includes(path));

    if (error.response?.status === 401) {
      const errorDetail = error.response?.data?.detail || "";

      if (
        isAuthEndpoint ||
        errorDetail.includes("credential") ||
        errorDetail.includes("درست نہیں") ||
        errorDetail.toLowerCase().includes("invalid")
      ) {
        return Promise.reject(error);
      }

      if (token) {
        const friendlyMessage = "آپ کا سیشن ختم ہو چکا ہے۔ براہ کرم دوبارہ لاگ ان کریں۔";

        // Show custom styled alert
        showCustomAlert(friendlyMessage, () => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        });

        return Promise.reject(new Error(friendlyMessage));
      }
    }

    return Promise.reject(error);
  }
);

export default axios;