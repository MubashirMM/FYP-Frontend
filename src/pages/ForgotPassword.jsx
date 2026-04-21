import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const API = import.meta.env.VITE_API_URL;
  const isAuthenticated = !!localStorage.getItem("token");

  const validateEmail = () => {
    if (!email.trim()) {
      setError("ای میل درج کریں");
      return false;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("درست ای میل ایڈریس درج کریں (example@domain.com)");
      return false;
    }
    if (email.length < 5) {
      setError("ای میل کم از کم 5 حروف کا ہونا چاہیے");
      return false;
    }
    return true;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    
    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(`${API}/auth/forgot-password`, null, {
        params: { email }
      });
      
      setSuccessMessage(res.data["پیغام"] || "✅ ری سیٹ کوڈ آپ کی ای میل پر بھیج دیا گیا ہے!");
      
      localStorage.setItem("reset_email", email);
      
      setTimeout(() => {
        navigate("/reset-password-confirm");
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || "ای میل درست نہیں ہے یا رجسٹرڈ نہیں ہے");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header isAuthenticated={isAuthenticated} user={null} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Forgot Password Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-center text-gray-800 mb-3 font-urdu">
            پاس ورڈ ری سیٹ کریں
          </h2>
          
          <p className="text-center text-gray-500 text-xs mb-4 font-urdu">
            اپنا ای میل درج کریں، ہم آپ کو ری سیٹ کوڈ بھیجیں گے
          </p>
          
          {error && (
            <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded-lg text-right text-sm font-urdu">
              ❌ {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-3 p-2 bg-green-100 border border-green-400 text-green-700 rounded-lg text-right animate-pulse text-sm font-urdu">
              ✅ {successMessage}
              <p className="text-xs mt-1">ری سیٹ پیج پر جا رہے ہیں...</p>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="اپنا ای میل درج کریں"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 text-sm"
            />
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-urdu text-base font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>کوڈ بھیجا جا رہا ہے...</span>
                </>
              ) : (
                "ری سیٹ کوڈ بھیجیں"
              )}
            </button>
          </form>
        </div>

        {/* Links Section - Outside the card */}
        <div className="mt-4 text-center">
          <Link to="/login" className="text-purple-600 hover:text-purple-700 font-urdu text-sm transition-all duration-200 hover:underline underline-offset-2">
            ← واپس لاگ ان پر جائیں
          </Link>
        </div>
      </main>
      
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}

export default ForgotPassword;