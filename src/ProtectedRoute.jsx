import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function ProtectedRoute({ children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      try {
        const API = import.meta.env.VITE_API_URL;
        // Using your existing /auth/me endpoint
        const response = await axios.get(`${API}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 200 && response.data) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Token validation failed:", error);
        // If 401 or any error, remove token
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
        }
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  if (isValidating) {
    // Show loading spinner while validating
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-urdu text-lg">تصدیق ہو رہی ہے...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center p-6" dir="rtl">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full border-t-4 border-red-500">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">رسائی ممنوع ہے</h2>
          <p className="text-gray-600 mb-4 text-lg">
            اس صفحے کو دیکھنے کے لیے آپ کا لاگ ان ہونا ضروری ہے۔
          </p>
          <p className="text-sm text-gray-500 mb-6">
            براہ کرم لاگ ان کریں یا اگر اکاؤنٹ نہیں ہے تو رجسٹر کریں۔
          </p>
          <Link
            to="/login"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors duration-200"
          >
            لاگ ان پیج پر جائیں
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;