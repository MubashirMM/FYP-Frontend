import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const API = import.meta.env.VITE_API_URL;

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
      
      // Save email in localStorage so ResetPasswordConfirm can use it
      localStorage.setItem("reset_email", email);
      
      // Navigate to reset page after 2 seconds
      setTimeout(() => {
        navigate("/reset-password-confirm");
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || "ای میل درست نہیں ہے یا رجسٹرڈ نہیں ہے");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6 font-urdu">
          پاس ورڈ ری سیٹ کریں
        </h2>
        
        <p className="text-center text-gray-600 mb-6 font-urdu">
          اپنا ای میل درج کریں، ہم آپ کو پاس ورڈ ری سیٹ کرنے کا کوڈ بھیجیں گے
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-right">
            ❌ {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-right animate-pulse">
            {successMessage}
            <p className="text-sm mt-1">ری سیٹ پیج پر جا رہے ہیں...</p>
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-urdu mb-2 text-right">
              ای میل
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-right font-urdu focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-urdu text-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>کوڈ بھیجا جا رہا ہے...</span>
              </>
            ) : (
              "ری سیٹ کوڈ بھیجیں"
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link to="/login" className="text-purple-600 hover:text-purple-700 font-urdu">
            ← واپس لاگ ان پر جائیں
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;